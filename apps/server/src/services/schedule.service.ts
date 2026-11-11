import crypto from 'node:crypto';
import { db } from '../db.js';

export interface ScheduledMeeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  roomId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  passcode?: string;
  recurrenceRule?: string;
  invitees: string[];
  createdAt: string;
  updatedAt: string;
}

export class ScheduleService {
  private scheduledMeetings: Map<string, ScheduledMeeting> = new Map();

  public async scheduleMeeting(params: {
    title: string;
    description?: string;
    hostId: string;
    roomId?: string;
    scheduledStart: string;
    scheduledEnd: string;
    timezone?: string;
    passcode?: string;
    recurrenceRule?: string;
    invitees?: string[];
  }): Promise<ScheduledMeeting> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const meeting: ScheduledMeeting = {
      id,
      title: params.title,
      description: params.description || '',
      hostId: params.hostId,
      roomId: params.roomId,
      scheduledStart: params.scheduledStart,
      scheduledEnd: params.scheduledEnd,
      timezone: params.timezone || 'UTC',
      passcode: params.passcode,
      recurrenceRule: params.recurrenceRule,
      invitees: params.invitees || [],
      createdAt: now,
      updatedAt: now,
    };

    if (db.isAvailable()) {
      try {
        await db.getPool()!.query(
          `INSERT INTO scheduled_meetings (id, title, description, host_id, room_id, scheduled_start, scheduled_end, timezone, passcode, recurrence_rule, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            meeting.id,
            meeting.title,
            meeting.description,
            meeting.hostId,
            meeting.roomId || null,
            meeting.scheduledStart,
            meeting.scheduledEnd,
            meeting.timezone,
            meeting.passcode || null,
            meeting.recurrenceRule || null,
            meeting.createdAt,
            meeting.updatedAt,
          ]
        );

        if (meeting.invitees.length > 0) {
          for (const inviteeId of meeting.invitees) {
            await db.getPool()!.query(
              `INSERT INTO scheduled_meeting_invitees (meeting_id, user_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`,
              [meeting.id, inviteeId]
            );
          }
        }
      } catch (err: any) {
        console.warn('[ScheduleService] DB write failed, falling back to memory:', err.message);
      }
    }

    this.scheduledMeetings.set(meeting.id, meeting);
    return meeting;
  }

  public async listUserMeetings(userId: string): Promise<ScheduledMeeting[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.getPool()!.query(
          `SELECT m.id, m.title, m.description, m.host_id AS "hostId", m.room_id AS "roomId",
                  m.scheduled_start AS "scheduledStart", m.scheduled_end AS "scheduledEnd",
                  m.timezone, m.passcode, m.recurrence_rule AS "recurrenceRule",
                  m.created_at AS "createdAt", m.updated_at AS "updatedAt"
           FROM scheduled_meetings m
           LEFT JOIN scheduled_meeting_invitees i ON i.meeting_id = m.id
           WHERE m.host_id = $1 OR i.user_id = $1
           GROUP BY m.id
           ORDER BY m.scheduled_start ASC`,
          [userId]
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err: any) {
        // fallback
      }
    }

    return Array.from(this.scheduledMeetings.values()).filter(
      (m) => m.hostId === userId || m.invitees.includes(userId)
    );
  }

  public async getMeeting(id: string): Promise<ScheduledMeeting | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.getPool()!.query(
          `SELECT id, title, description, host_id AS "hostId", room_id AS "roomId",
                  scheduled_start AS "scheduledStart", scheduled_end AS "scheduledEnd",
                  timezone, passcode, recurrence_rule AS "recurrenceRule",
                  created_at AS "createdAt", updated_at AS "updatedAt"
           FROM scheduled_meetings WHERE id::text = $1 LIMIT 1`,
          [id]
        );
        if (res.rows[0]) return res.rows[0];
      } catch (err: any) {
        // fallback
      }
    }

    return this.scheduledMeetings.get(id) || null;
  }

  public async cancelMeeting(id: string, userId: string): Promise<boolean> {
    const meeting = await this.getMeeting(id);
    if (!meeting || meeting.hostId !== userId) {
      return false;
    }

    if (db.isAvailable()) {
      try {
        await db.getPool()!.query(`DELETE FROM scheduled_meetings WHERE id::text = $1`, [id]);
      } catch (err: any) {
        // fallback
      }
    }

    this.scheduledMeetings.delete(id);
    return true;
  }
}

export const scheduleService = new ScheduleService();
