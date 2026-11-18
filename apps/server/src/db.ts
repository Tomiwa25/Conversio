import pg from 'pg';
import { config } from './config.js';
import { logger } from './logger.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool | null = null;
  private isConnected = false;

  constructor() {
    if (config.databaseUrl && process.env.NODE_ENV !== 'test') {
      try {
        this.pool = new Pool({
          connectionString: config.databaseUrl,
          max: 20, // 20 pooled connections
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        // Test connection
        this.pool
          .query('SELECT NOW()')
          .then(() => {
            this.isConnected = true;
            logger.info('[Database] Connected to PostgreSQL successfully.');
            this.runMigrations();
          })
          .catch((err) => {
            logger.warn('[Database] PostgreSQL connection failed, falling back to in-memory store:', { error: err.message });
            this.isConnected = false;
          });
      } catch (err) {
        logger.warn('[Database] Failed to initialize PostgreSQL pool:', { error: err });
      }
    }
  }

  public getPool(): pg.Pool | null {
    return this.isConnected ? this.pool : null;
  }

  public isAvailable(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Healthcheck probe for DB connectivity & latency measurement
   */
  public async checkHealth(): Promise<{ isConnected: boolean; latencyMs: number }> {
    if (!this.pool || !this.isConnected) {
      return { isConnected: false, latencyMs: 0 };
    }

    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { isConnected: true, latencyMs: Date.now() - start };
    } catch {
      return { isConnected: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Atomic Transaction Execution Wrapper (ensures data consistency & rollback on failure)
   */
  public async withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not available for transaction.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('[Database Transaction] Rolled back transaction due to error:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Run idempotent schema migrations on startup
   */
  public async runMigrations(): Promise<void> {
    if (!this.pool) return;

    const migrationSql = `
      -- 1. Rooms Table with Optimistic Concurrency Control (lock_version)
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        host_id VARCHAR(255) NOT NULL,
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        locked_by VARCHAR(255),
        locked_at TIMESTAMPTZ,
        lock_version INTEGER NOT NULL DEFAULT 1,
        max_participants INTEGER NOT NULL DEFAULT 50,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        waiting_room_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        passcode_hash VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
      CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);

      -- 2. Durable Idempotency Records Table
      CREATE TABLE IF NOT EXISTS idempotency_records (
        key VARCHAR(255) PRIMARY KEY,
        payload_hash VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        status_code INTEGER,
        response_body JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_records(expires_at);

      -- 3. Room Audit Events Table
      CREATE TABLE IF NOT EXISTS room_events (
        id SERIAL PRIMARY KEY,
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        event_type VARCHAR(64) NOT NULL,
        actor_id VARCHAR(255) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_room_events_room_id ON room_events(room_id);

      -- 4. Users Table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(64) NOT NULL DEFAULT 'user',
        avatar_url TEXT,
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 5. Refresh Tokens Table
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

      -- 6. Password Reset Tokens Table (Single-use, hashed, 15m expiry)
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

      -- 7. Channels Table
      CREATE TABLE IF NOT EXISTS channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_private BOOLEAN NOT NULL DEFAULT FALSE,
        created_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 8. Channel Memberships
      CREATE TABLE IF NOT EXISTS channel_members (
        channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(64) NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (channel_id, user_id)
      );

      -- 9. Channel Messages Table
      CREATE TABLE IF NOT EXISTS channel_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 10. Direct Messages Table
      CREATE TABLE IF NOT EXISTS direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 11. Scheduled Meetings Table
      CREATE TABLE IF NOT EXISTS scheduled_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        host_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        room_id UUID,
        scheduled_start TIMESTAMPTZ NOT NULL,
        scheduled_end TIMESTAMPTZ NOT NULL,
        timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
        passcode VARCHAR(255),
        recurrence_rule VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 12. Scheduled Meeting Invitees
      CREATE TABLE IF NOT EXISTS scheduled_meeting_invitees (
        meeting_id UUID REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        PRIMARY KEY (meeting_id, user_id)
      );
    `;

    try {
      await this.pool.query(migrationSql);
      logger.info('[Database] PostgreSQL schema migrations verified.');
    } catch (err) {
      logger.error('[Database] Schema migration error:', err);
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
    }
  }
}

export const db = new Database();
