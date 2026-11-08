import pg from 'pg';
import { config } from './config.js';

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
            console.log('[Database] Connected to PostgreSQL successfully.');
            this.runMigrations();
          })
          .catch((err) => {
            console.warn('[Database] PostgreSQL connection failed, falling back to in-memory store:', err.message);
            this.isConnected = false;
          });
      } catch (err) {
        console.warn('[Database] Failed to initialize PostgreSQL pool:', err);
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Index for active room lookups
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
    `;

    try {
      await this.pool.query(migrationSql);
      console.log('[Database] PostgreSQL schema migrations verified.');
    } catch (err) {
      console.error('[Database] Schema migration error:', err);
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

