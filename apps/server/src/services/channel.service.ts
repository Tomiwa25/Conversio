import crypto from 'node:crypto';
import { db } from '../db.js';

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName?: string;
  content: string;
  attachments: any[];
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachments: any[];
  isRead: boolean;
  createdAt: string;
}

export class ChannelService {
  // In-memory fallback stores
  private channels: Map<string, Channel> = new Map();
  private channelMembers: Map<string, Set<string>> = new Map(); // channelId -> Set<userId>
  private channelMessages: Map<string, ChannelMessage[]> = new Map(); // channelId -> messages
  private directMessages: DirectMessage[] = [];

  constructor() {
    // Seed default public channels
    const generalChannel: Channel = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'General',
      slug: 'general',
      description: 'Company-wide announcements and team discussions',
      isPrivate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const randomChannel: Channel = {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Random',
      slug: 'random',
      description: 'Watercooler chats, fun links, and casual hangout',
      isPrivate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.channels.set(generalChannel.id, generalChannel);
    this.channels.set(randomChannel.id, randomChannel);
    this.channelMessages.set(generalChannel.id, []);
    this.channelMessages.set(randomChannel.id, []);
  }

  public async createChannel(params: {
    name: string;
    slug?: string;
    description?: string;
    isPrivate?: boolean;
    createdBy?: string;
  }): Promise<Channel> {
    const id = crypto.randomUUID();
    const slug = (params.slug || params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `channel-${id.slice(0, 6)}`;
    const now = new Date().toISOString();

    const channel: Channel = {
      id,
      name: params.name,
      slug,
      description: params.description || '',
      isPrivate: params.isPrivate || false,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    if (db.isAvailable()) {
      try {
        await db.getPool()!.query(
          `INSERT INTO channels (id, name, slug, description, is_private, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [channel.id, channel.name, channel.slug, channel.description, channel.isPrivate, channel.createdBy || null, channel.createdAt, channel.updatedAt]
        );
        if (params.createdBy) {
          await db.getPool()!.query(
            `INSERT INTO channel_members (channel_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
            [channel.id, params.createdBy]
          );
        }
      } catch (err: any) {
        console.warn('[ChannelService] DB error during channel creation, stored in memory:', err.message);
      }
    }

    this.channels.set(channel.id, channel);
    this.channelMessages.set(channel.id, []);
    if (params.createdBy) {
      if (!this.channelMembers.has(channel.id)) this.channelMembers.set(channel.id, new Set());
      this.channelMembers.get(channel.id)!.add(params.createdBy);
    }

    return channel;
  }

  public async listChannels(userId?: string): Promise<Channel[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.getPool()!.query(
          `SELECT id, name, slug, description, is_private AS "isPrivate", created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
           FROM channels ORDER BY created_at ASC`
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        console.warn('[ChannelService] DB query failed, falling back to in-memory:', err.message);
      }
    }

    return Array.from(this.channels.values());
  }

  public async getChannel(idOrSlug: string): Promise<Channel | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.getPool()!.query(
          `SELECT id, name, slug, description, is_private AS "isPrivate", created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
           FROM channels WHERE id::text = $1 OR slug = $1 LIMIT 1`,
          [idOrSlug]
        );
        if (res.rows[0]) return res.rows[0];
      } catch (err: any) {
        // fallback
      }
    }

    for (const channel of this.channels.values()) {
      if (channel.id === idOrSlug || channel.slug === idOrSlug) {
        return channel;
      }
    }
    return null;
  }

  public async postChannelMessage(params: {
    channelId: string;
    senderId: string;
    senderName?: string;
    content: string;
    attachments?: any[];
  }): Promise<ChannelMessage> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const message: ChannelMessage = {
      id,
      channelId: params.channelId,
      senderId: params.senderId,
      senderName: params.senderName,
      content: params.content,
      attachments: params.attachments || [],
      createdAt: now,
    };

    if (db.isAvailable()) {
      try {
        await db.getPool()!.query(
          `INSERT INTO channel_messages (id, channel_id, sender_id, content, attachments, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $6)`,
          [message.id, message.channelId, message.senderId, message.content, JSON.stringify(message.attachments), message.createdAt]
        );
      } catch (err: any) {
        console.warn('[ChannelService] DB write error for message:', err.message);
      }
    }

    if (!this.channelMessages.has(params.channelId)) {
      this.channelMessages.set(params.channelId, []);
    }
    this.channelMessages.get(params.channelId)!.push(message);

    return message;
  }

  public async getChannelMessages(channelId: string, limit = 50): Promise<ChannelMessage[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.getPool()!.query(
          `SELECT m.id, m.channel_id AS "channelId", m.sender_id AS "senderId", u.name AS "senderName",
                  m.content, m.attachments, m.created_at AS "createdAt"
           FROM channel_messages m
           LEFT JOIN users u ON u.id = m.sender_id
           WHERE m.channel_id::text = $1
           ORDER BY m.created_at ASC
           LIMIT $2`,
          [channelId, limit]
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err: any) {
        // fallback
      }
    }

    const messages = this.channelMessages.get(channelId) || [];
    return messages.slice(-limit);
  }

  public async sendDirectMessage(params: {
    senderId: string;
    recipientId: string;
    content: string;
    attachments?: any[];
  }): Promise<DirectMessage> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const message: DirectMessage = {
      id,
      senderId: params.senderId,
      recipientId: params.recipientId,
      content: params.content,
      attachments: params.attachments || [],
      isRead: false,
      createdAt: now,
    };

    if (db.isAvailable()) {
      try {
        await db.getPool()!.query(
          `INSERT INTO direct_messages (id, sender_id, recipient_id, content, attachments, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [message.id, message.senderId, message.recipientId, message.content, JSON.stringify(message.attachments), message.isRead, message.createdAt]
        );
      } catch (err: any) {
        console.warn('[ChannelService] DB write error for direct message:', err.message);
      }
    }

    this.directMessages.push(message);
    return message;
  }

  public async getDirectMessages(user1: string, user2: string, limit = 50): Promise<DirectMessage[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.getPool()!.query(
          `SELECT id, sender_id AS "senderId", recipient_id AS "recipientId", content, attachments, is_read AS "isRead", created_at AS "createdAt"
           FROM direct_messages
           WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
           ORDER BY created_at ASC
           LIMIT $3`,
          [user1, user2, limit]
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err: any) {
        // fallback
      }
    }

    return this.directMessages
      .filter(
        (m) =>
          (m.senderId === user1 && m.recipientId === user2) ||
          (m.senderId === user2 && m.recipientId === user1)
      )
      .slice(-limit);
  }
}

export const channelService = new ChannelService();
