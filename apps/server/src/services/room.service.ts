import crypto from 'node:crypto';
import { CreateRoomDto, LockRoomDto, Room, RoomActionResponse } from '@conversio/shared';

export class RoomService {
  private rooms: Map<string, Room> = new Map();

  public createRoom(dto: CreateRoomDto): Room {
    const roomId = crypto.randomUUID();
    const now = new Date().toISOString();

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
    };

    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  public setRoomLock(roomId: string, dto: LockRoomDto): RoomActionResponse {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Verify host/authorized user permission
    if (room.hostId !== dto.userId) {
      return { success: false, error: 'Only the room host can lock or unlock this room' };
    }

    // Optimistic Concurrency Control (OCC) check
    if (room.lockState.lockVersion !== dto.expectedVersion) {
      return {
        success: false,
        versionMismatch: true,
        error: `Lock version mismatch. Expected ${dto.expectedVersion}, but room is currently at version ${room.lockState.lockVersion}.`,
      };
    }

    // Atomic version bump & state update
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

  public isRoomLocked(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return Boolean(room?.lockState.isLocked);
  }

  public listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

export const roomService = new RoomService();

