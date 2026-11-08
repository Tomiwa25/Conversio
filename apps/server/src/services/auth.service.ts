import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import {
  AuthResponseDto,
  RoomRole,
  RoomTokenPayload,
  UserProfile,
  UserTokenPayload,
} from '@conversio/shared';
import { config } from '../config.js';
import { db } from '../db.js';

interface InMemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'host' | 'user';
  createdAt: string;
}

export class AuthService {
  private secret: string;
  private inMemoryUsers: Map<string, InMemoryUser> = new Map();
  private inMemoryRefreshTokens: Set<string> = new Set();

  constructor() {
    this.secret = config.jwtSecret;

    // Seed default admin/host in-memory for zero-config offline runs
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
    this.inMemoryUsers.set('sarah@conversio.io', {
      id: 'user-sarah-host',
      name: 'Sarah Connor (Host)',
      email: 'sarah@conversio.io',
      passwordHash: defaultPasswordHash,
      role: 'host',
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Secure Password Hashing with Salt Work Factor 10
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Issue Dual-Token Pair: Short-lived Access Token (15m) + Long-lived Refresh Token (7d)
   */
  public generateUserTokens(user: { id: string; email: string; name: string; role: string }): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'access',
      },
      this.secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'refresh',
      },
      this.secret,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  public verifyAccessToken(token: string): UserTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as UserTokenPayload;
      if (decoded.type !== 'access') return null;
      return decoded;
    } catch {
      return null;
    }
  }

  public verifyRefreshToken(token: string): UserTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as UserTokenPayload;
      if (decoded.type !== 'refresh') return null;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Register a new user
   */
  public async register(name: string, email: string, password: string): Promise<AuthResponseDto> {
    const normalizedEmail = email.toLowerCase().trim();
    const pool = db.getPool();

    // Check if user already exists
    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existing.rows.length > 0) {
        throw new Error('An account with this email address already exists.');
      }
    } else {
      if (this.inMemoryUsers.has(normalizedEmail)) {
        throw new Error('An account with this email address already exists.');
      }
    }

    const passwordHash = await this.hashPassword(password);
    const userId = `user-${crypto.randomUUID().slice(0, 8)}`;
    const role: 'host' | 'user' = 'host'; // Default to host capability for room creation
    const createdAt = new Date().toISOString();

    if (pool) {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, name.trim(), normalizedEmail, passwordHash, role, createdAt, createdAt]
      );
    } else {
      this.inMemoryUsers.set(normalizedEmail, {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        createdAt,
      });
    }

    const user: UserProfile = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role,
      createdAt,
    };

    const tokens = this.generateUserTokens(user);
    await this.storeRefreshToken(userId, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Authenticate an existing user
   */
  public async login(email: string, password: string): Promise<AuthResponseDto> {
    const normalizedEmail = email.toLowerCase().trim();
    const pool = db.getPool();

    let userRecord: { id: string; name: string; email: string; password_hash: string; role: any; created_at: any } | null = null;

    if (pool) {
      const res = await pool.query(
        'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
        [normalizedEmail]
      );
      if (res.rows.length > 0) {
        userRecord = res.rows[0];
      }
    } else {
      const mem = this.inMemoryUsers.get(normalizedEmail);
      if (mem) {
        userRecord = {
          id: mem.id,
          name: mem.name,
          email: mem.email,
          password_hash: mem.passwordHash,
          role: mem.role,
          created_at: mem.createdAt,
        };
      }
    }

    if (!userRecord) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await this.verifyPassword(password, userRecord.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Update last login timestamp
    if (pool) {
      pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userRecord.id]).catch(() => {});
    }

    const user: UserProfile = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role || 'user',
      createdAt: userRecord.created_at,
    };

    const tokens = this.generateUserTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Get user profile by ID
   */
  public async getUserById(userId: string): Promise<UserProfile | null> {
    const pool = db.getPool();
    if (pool) {
      const res = await pool.query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1', [
        userId,
      ]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
        };
      }
      return null;
    }

    for (const u of this.inMemoryUsers.values()) {
      if (u.id === userId) {
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        };
      }
    }

    return null;
  }

  /**
   * Store and hash refresh token for revocation tracking
   */
  public async storeRefreshToken(userId: string, token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pool = db.getPool();

    if (pool) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
      );
    } else {
      this.inMemoryRefreshTokens.add(tokenHash);
    }
  }

  /**
   * Revoke a refresh token (Logout)
   */
  public async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pool = db.getPool();

    if (pool) {
      await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
    } else {
      this.inMemoryRefreshTokens.delete(tokenHash);
    }
  }

  /**
   * Ephemeral Room Admission Token
   */
  public generateRoomToken(payload: {
    roomId: string;
    userId: string;
    name: string;
    role: RoomRole;
  }): string {
    return jwt.sign(
      {
        roomId: payload.roomId,
        userId: payload.userId,
        name: payload.name,
        role: payload.role,
      },
      this.secret,
      { expiresIn: '12h' }
    );
  }

  public verifyRoomToken(token: string): RoomTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as RoomTokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
