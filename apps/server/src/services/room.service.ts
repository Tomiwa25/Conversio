import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { CreateRoomDto, LockRoomDto, Room, RoomActionResponse } from '@conversio/shared';
import { db } from '../db.js';

export class RoomService {
  private memoryRooms: Map<string, Room> = new Map();
  private memoryPasscodes: Map<string, string> = new Map();

  public async createRoom(dto: CreateRoomDto): Promise<Room> {
    const roomId = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = db.getPool();

    let passcodeHash: string | null = null;
    if (dto.passcode && dto.passcode.trim()) {
      passcodeHash = await bcrypt.hash(dto.passcode.trim(), 10);
    }

    if (pool) {
      try {
        const query = `
          INSERT INTO rooms (id, title, host_id, is_locked, lock_version, max_participants, is_active, passcode_hash, created_at, updated_at)
          VALUES ($1, $2, $3, false, 1, $4, true, $5, NOW(), NOW())
          RETURNING *;
        `;
        const res = await pool.query(query, [
          roomId,
          dto.title.trim(),
          dto.hostId,
          dto.maxParticipants || 50,
          passcodeHash,
        ]);
        const row = res.rows[0];

        // Audit Event
        await pool.query(
          `INSERT INTO room_events (room_id, event_type, actor_id, metadata) VALUES ($1, 'ROOM_CREATED', $2, $3)`,
          [roomId, dto.hostId, JSON.stringify({ title: dto.title, passcodeProtected: Boolean(passcodeHash) })]
        );

        return {
          id: row.id,
          title: row.title,
          hostId: row.host_id,
          createdAt: row.created_at.toISOString(),
          lockState: {
            isLocked: row.is_locked,
            lockVersion: row.lock_version,
          },
          maxParticipants: row.max_participants,
          isActive: row.is_active,
          isPasscodeProtected: Boolean(row.passcode_hash),
        };
      } catch (err) {
        console.warn('[RoomService] PostgreSQL createRoom failed, falling back to memory:', err);
      }
    }

    if (passcodeHash) {
      this.memoryPasscodes.set(roomId, passcodeHash);
    }

    const room: Room = {
      id: roomId,
      title: dto.title.trim(),
      hostId: dto.hostId,
      createdAt: now,
      lockState: {
        isLocked: false,
        lockVersion: 1,
      },
      maxParticipants: dto.maxParticipants || 50,
      isActive: true,
      isPasscodeProtected: Boolean(passcodeHash),
    };

    this.memoryRooms.set(roomId, room);
    return room;
  }

  public async getRoom(roomId: string): Promise<Room | null> {
    const pool = db.getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM rooms WHERE id = $1 AND is_active = true', [roomId]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          title: row.title,
          hostId: row.host_id,
          createdAt: row.created_at.toISOString(),
          lockState: {
            isLocked: row.is_locked,
            lockedBy: row.locked_by || undefined,
            lockedAt: row.locked_at ? row.locked_at.toISOString() : undefined,
            lockVersion: row.lock_version,
          },
          maxParticipants: row.max_participants,
          isActive: row.is_active,
          isPasscodeProtected: Boolean(row.passcode_hash),
        };
      } catch (err) {
        console.warn('[RoomService] PostgreSQL getRoom failed, falling back to memory:', err);
      }
    }

    const mem = this.memoryRooms.get(roomId);
    if (mem) {
      return {
        ...mem,
        isPasscodeProtected: this.memoryPasscodes.has(roomId),
      };
    }

    return null;
  }

  public async verifyRoomPasscode(roomId: string, passcode?: string): Promise<boolean> {
    const pool = db.getPool();
    let storedHash: string | null = null;

    if (pool) {
      try {
        const res = await pool.query('SELECT passcode_hash FROM rooms WHERE id = $1', [roomId]);
        if (res.rows.length > 0) {
          storedHash = res.rows[0].passcode_hash;
        }
      } catch (e) {
        console.warn('[RoomService] Passcode lookup query failed:', e);
      }
    }

    if (!storedHash) {
      storedHash = this.memoryPasscodes.get(roomId) || null;
    }

    // If room is not passcode protected, admission granted
    if (!storedHash) return true;

    // If passcode protected but no passcode supplied, denied
    if (!passcode) return false;

    return bcrypt.compare(passcode.trim(), storedHash);
  }

  public async setRoomLock(roomId: string, dto: LockRoomDto): Promise<RoomActionResponse> {
    const pool = db.getPool();
    if (pool) {
      try {
        const existingRes = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        if (existingRes.rows.length === 0) {
          return { success: false, error: 'Room not found' };
        }

        const existing = existingRes.rows[0];

        if (existing.host_id !== dto.userId) {
          return { success: false, error: 'Only the room host can lock or unlock this room' };
        }

        if (existing.lock_version !== dto.expectedVersion) {
          return {
            success: false,
            versionMismatch: true,
            error: `Lock version mismatch. Expected ${dto.expectedVersion}, but room is currently at version ${existing.lock_version}.`,
          };
        }

        const updateQuery = `
          UPDATE rooms
          SET is_locked = $1, locked_by = $2, locked_at = $3, lock_version = lock_version + 1, updated_at = NOW()
          WHERE id = $4 AND lock_version = $5
          RETURNING *;
        `;
        const lockedAt = dto.isLocked ? new Date() : null;
        const lockedBy = dto.isLocked ? dto.userId : null;

        const updateRes = await pool.query(updateQuery, [
          dto.isLocked,
          lockedBy,
          lockedAt,
          roomId,
          dto.expectedVersion,
        ]);

        if (updateRes.rows.length === 0) {
          return {
            success: false,
            versionMismatch: true,
            error: 'Concurrent lock modification detected.',
          };
        }

        const updated = updateRes.rows[0];

        await pool.query(
          `INSERT INTO room_events (room_id, event_type, actor_id, metadata) VALUES ($1, $2, $3, $4)`,
          [
            roomId,
            dto.isLocked ? 'ROOM_LOCKED' : 'ROOM_UNLOCKED',
            dto.userId,
            JSON.stringify({ newVersion: updated.lock_version }),
          ]
        );

        return {
          success: true,
          room: {
            id: updated.id,
            title: updated.title,
            hostId: updated.host_id,
            createdAt: updated.created_at.toISOString(),
            lockState: {
              isLocked: updated.is_locked,
              lockedBy: updated.locked_by || undefined,
              lockedAt: updated.locked_at ? updated.locked_at.toISOString() : undefined,
              lockVersion: updated.lock_version,
            },
            maxParticipants: updated.max_participants,
            isActive: updated.is_active,
            isPasscodeProtected: Boolean(updated.passcode_hash),
          },
        };
      } catch (err) {
        console.warn('[RoomService] PostgreSQL setRoomLock failed, falling back to memory:', err);
      }
    }

    const room = this.memoryRooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== dto.userId) {
      return { success: false, error: 'Only the room host can lock or unlock this room' };
    }

    if (room.lockState.lockVersion !== dto.expectedVersion) {
      return {
        success: false,
        versionMismatch: true,
        error: `Lock version mismatch. Expected ${dto.expectedVersion}, but room is currently at version ${room.lockState.lockVersion}.`,
      };
    }

    room.lockState = {
      isLocked: dto.isLocked,
      lockedBy: dto.isLocked ? dto.userId : undefined,
      lockedAt: dto.isLocked ? new Date().toISOString() : undefined,
      lockVersion: room.lockState.lockVersion + 1,
    };

    return {
      success: true,
      room,
    };
  }

  public async isRoomLocked(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    return Boolean(room?.lockState.isLocked);
  }

  public listRooms(): Room[] {
    return Array.from(this.memoryRooms.values());
  }
}

export const roomService = new RoomService();
