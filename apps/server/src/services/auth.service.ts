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
import { logger } from '../logger.js';

interface InMemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'host' | 'user';
  createdAt: string;
}

interface InMemoryResetToken {
  userId: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}

export class AuthService {
  private secret: string;
  private inMemoryUsers: Map<string, InMemoryUser> = new Map();
  private inMemoryRefreshTokens: Set<string> = new Set();
  private inMemoryResetTokens: Map<string, InMemoryResetToken> = new Map();

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
    }

    this.inMemoryUsers.set(normalizedEmail, {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt,
    });

    const user: UserProfile = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role,
      createdAt,
    };

    const tokens = this.generateUserTokens(user);
    await this.storeRefreshToken(userId, tokens.refreshToken);

    logger.info(`User registered successfully: ${normalizedEmail} (${userId})`);

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
    }

    if (!userRecord) {
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

    logger.info(`User logged in: ${normalizedEmail} (${user.id})`);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Request Password Reset with Defense Against Password Reset Poisoning
   *
   * SECURITY MEASURES:
   * 1. Never trusts raw Host or X-Forwarded-Host headers.
   * 2. The reset URL is strictly anchored to config.frontendUrl.
   * 3. 32-byte cryptographic random token (256-bit entropy).
   * 4. Stored only as SHA-256 hash in DB to prevent token leaks.
   * 5. 15-minute strict time-to-live.
   * 6. User enumeration prevention: Uniform generic response returned.
   */
  public async requestPasswordReset(email: string): Promise<{
    message: string;
    resetToken?: string; // Returned only in dev/test for verification convenience
    resetUrl?: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const pool = db.getPool();

    let targetUserId: string | null = null;

    if (pool) {
      const res = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (res.rows.length > 0) {
        targetUserId = res.rows[0].id;
      }
    } else {
      const mem = this.inMemoryUsers.get(normalizedEmail);
      if (mem) {
        targetUserId = mem.id;
      }
    }

    // Generate cryptographic 32-byte random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Anchor to trusted server configuration ONLY (defending against Host header poisoning)
    const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

    if (targetUserId) {
      if (pool) {
        // Invalidate any existing unused reset tokens for this user
        await pool.query(
          'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
          [targetUserId]
        );

        // Store new hashed token
        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [targetUserId, tokenHash, expiresAt]
        );
      } else {
        // Invalidate existing in-memory tokens for this user
        for (const [hash, record] of this.inMemoryResetTokens.entries()) {
          if (record.userId === targetUserId && !record.used) {
            record.used = true;
          }
        }
        this.inMemoryResetTokens.set(tokenHash, {
          userId: targetUserId,
          tokenHash,
          expiresAt: expiresAt.getTime(),
          used: false,
        });
      }

      logger.info(`Password reset requested for user: ${normalizedEmail}`);
    } else {
      // Dummy delay to resist timing side-channel enumeration
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
      logger.info(`Password reset requested for non-existent email: ${normalizedEmail} (silent rejection)`);
    }

    const isNonProd = config.nodeEnv !== 'production';

    return {
      message: 'If an account exists with this email address, password reset instructions have been dispatched.',
      ...(isNonProd ? { resetToken: rawToken, resetUrl } : {}),
    };
  }

  /**
   * Reset Password with Token Verification, Single-Use Invalidation & Full Session Revocation
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || token.length < 32) {
      throw new Error('Invalid or malformed reset token.');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pool = db.getPool();

    let userId: string | null = null;
    let tokenId: string | null = null;

    if (pool) {
      const res = await pool.query(
        `SELECT id, user_id, expires_at, used_at
         FROM password_reset_tokens
         WHERE token_hash = $1`,
        [tokenHash]
      );

      if (res.rows.length === 0) {
        throw new Error('Invalid or expired password reset token.');
      }

      const row = res.rows[0];
      if (row.used_at !== null) {
        throw new Error('This password reset link has already been used.');
      }

      if (new Date(row.expires_at).getTime() < Date.now()) {
        throw new Error('This password reset link has expired. Please request a new one.');
      }

      userId = row.user_id;
      tokenId = row.id;
    } else {
      const record = this.inMemoryResetTokens.get(tokenHash);
      if (!record) {
        throw new Error('Invalid or expired password reset token.');
      }

      if (record.used) {
        throw new Error('This password reset link has already been used.');
      }

      if (record.expiresAt < Date.now()) {
        throw new Error('This password reset link has expired. Please request a new one.');
      }

      userId = record.userId;
    }

    if (!userId) {
      throw new Error('User associated with reset token was not found.');
    }

    const newPasswordHash = await this.hashPassword(newPassword);

    if (pool) {
      // Execute atomically in a transaction: update password, invalidate reset token, and revoke all active sessions
      await db.withTransaction(async (client) => {
        // 1. Update user password
        await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
          newPasswordHash,
          userId,
        ]);

        // 2. Mark reset token used
        await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);

        // 3. Revoke all active refresh tokens for the user (session termination for safety)
        await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [
          userId,
        ]);
      });
    } else {
      // In-memory update
      for (const u of this.inMemoryUsers.values()) {
        if (u.id === userId) {
          u.passwordHash = newPasswordHash;
          break;
        }
      }

      const record = this.inMemoryResetTokens.get(tokenHash);
      if (record) {
        record.used = true;
      }

      // Revoke in-memory sessions
      this.inMemoryRefreshTokens.clear();
    }

    logger.info(`Password successfully reset and sessions revoked for user: ${userId}`);
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
