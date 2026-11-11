import crypto from 'node:crypto';
import Redis from 'ioredis';
import { IdempotencyCheckResult, IdempotencyRecord } from '@conversio/shared';
import { config } from '../config.js';
import { db } from '../db.js';

export class IdempotencyService {
  private redisClient: Redis | null = null;
  private memoryStore: Map<string, IdempotencyRecord> = new Map();

  constructor() {
    if (config.redisUrl && process.env.NODE_ENV !== 'test') {
      try {
        this.redisClient = new Redis(config.redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null, // Stop retrying if Redis is not running
        });
        this.redisClient.on('error', () => {
          // Gracefully suppress unhandled socket error emissions
        });
        this.redisClient.connect().catch(() => {
          this.redisClient = null;
        });
      } catch (err) {
        this.redisClient = null;
      }
    }
  }

  public async close(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (e) {
        // Ignored
      }
      this.redisClient = null;
    }
  }

  public hashPayload(payload: unknown): string {
    const serialized = JSON.stringify(payload || {}, Object.keys(payload || {}).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  public async acquireOrReplay(
    key: string,
    payload: unknown,
    ttlSeconds: number = config.idempotencyTtlSeconds
  ): Promise<IdempotencyCheckResult> {
    const payloadHash = this.hashPayload(payload);
    const namespacedKey = `idempotency:${key}`;

    // 1. Layer 1: Redis In-Flight Mutex / Fast Cache
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const redisCheck = await this.acquireRedis(namespacedKey, key, payloadHash, ttlSeconds);
        if (redisCheck.action !== 'PROCEED') {
          return redisCheck;
        }
      } catch (err) {
        console.warn('[IdempotencyService] Redis check failed, falling back to in-memory:', err);
        this.redisClient = null;
      }
    }

    // 2. Layer 2: PostgreSQL Durable Persistence
    const pool = db.getPool();
    if (pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM idempotency_records WHERE key = $1 AND expires_at > NOW()',
          [key]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          if (row.payload_hash !== payloadHash) {
            return { action: 'PAYLOAD_MISMATCH' };
          }
          if (row.status === 'RESOLVED') {
            return {
              action: 'REPLAY',
              cachedRecord: {
                key: row.key,
                payloadHash: row.payload_hash,
                status: row.status,
                statusCode: row.status_code,
                responseBody: row.response_body,
                createdAt: new Date(row.created_at).getTime(),
                expiresAt: new Date(row.expires_at).getTime(),
              },
            };
          }
        }
      } catch (err) {
        console.warn('[IdempotencyService] PostgreSQL lookup failed:', err);
      }
    }

    if (!this.redisClient) {
      return this.acquireMemory(namespacedKey, key, payloadHash, ttlSeconds);
    }

    return { action: 'PROCEED' };
  }

  public async resolve(
    key: string,
    statusCode: number,
    responseBody: unknown,
    ttlSeconds: number = config.idempotencyTtlSeconds
  ): Promise<void> {
    const namespacedKey = `idempotency:${key}`;
    const now = Date.now();

    // Save to Redis (Cache Layer)
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const raw = await this.redisClient.get(namespacedKey);
        if (raw) {
          const record: IdempotencyRecord = JSON.parse(raw);
          record.status = 'RESOLVED';
          record.statusCode = statusCode;
          record.responseBody = responseBody;
          record.expiresAt = now + ttlSeconds * 1000;
          await this.redisClient.set(namespacedKey, JSON.stringify(record), 'EX', ttlSeconds);
        }
      } catch (err) {
        console.warn('[IdempotencyService] Redis resolve write failed:', err);
      }
    } else {
      const record = this.memoryStore.get(namespacedKey);
      if (record) {
        record.status = 'RESOLVED';
        record.statusCode = statusCode;
        record.responseBody = responseBody;
        record.expiresAt = now + ttlSeconds * 1000;
      }
    }

    // Save to PostgreSQL (Durable Layer)
    const pool = db.getPool();
    if (pool) {
      try {
        const payloadHash = this.hashPayload(responseBody);
        await pool.query(
          `INSERT INTO idempotency_records (key, payload_hash, status, status_code, response_body, created_at, expires_at)
           VALUES ($1, $2, 'RESOLVED', $3, $4, NOW(), NOW() + interval '1 second' * $5)
           ON CONFLICT (key) DO UPDATE
           SET status = 'RESOLVED', status_code = EXCLUDED.status_code, response_body = EXCLUDED.response_body, expires_at = EXCLUDED.expires_at`,
          [key, payloadHash, statusCode, JSON.stringify(responseBody), ttlSeconds]
        );
      } catch (err) {
        console.warn('[IdempotencyService] PostgreSQL resolve save failed:', err);
      }
    }
  }

  public async fail(key: string): Promise<void> {
    const namespacedKey = `idempotency:${key}`;
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        await this.redisClient.del(namespacedKey);
      } catch (err) {
        // Ignored
      }
    } else {
      this.memoryStore.delete(namespacedKey);
    }

    const pool = db.getPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM idempotency_records WHERE key = $1', [key]);
      } catch (e) {
        // Ignored
      }
    }
  }

  private async acquireRedis(
    namespacedKey: string,
    key: string,
    payloadHash: string,
    ttlSeconds: number
  ): Promise<IdempotencyCheckResult> {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      return this.acquireMemory(namespacedKey, key, payloadHash, ttlSeconds);
    }

    const now = Date.now();
    const pendingRecord: IdempotencyRecord = {
      key,
      payloadHash,
      status: 'PENDING',
      statusCode: 0,
      responseBody: null,
      createdAt: now,
      expiresAt: now + config.lockMutexTtlSeconds * 1000,
    };

    // Atomic SET NX PX with short lock TTL (mutex)
    const acquired = await this.redisClient.set(
      namespacedKey,
      JSON.stringify(pendingRecord),
      'PX',
      config.lockMutexTtlSeconds * 1000,
      'NX'
    );

    if (acquired === 'OK') {
      return { action: 'PROCEED' };
    }

    // Key exists; inspect current record
    const raw = await this.redisClient.get(namespacedKey);
    if (!raw) {
      return { action: 'PROCEED' };
    }

    const existing: IdempotencyRecord = JSON.parse(raw);

    if (existing.payloadHash !== payloadHash) {
      return { action: 'PAYLOAD_MISMATCH', cachedRecord: existing };
    }

    if (existing.status === 'PENDING') {
      return { action: 'IN_FLIGHT_CONFLICT', cachedRecord: existing };
    }

    return { action: 'REPLAY', cachedRecord: existing };
  }

  private acquireMemory(
    namespacedKey: string,
    key: string,
    payloadHash: string,
    ttlSeconds: number
  ): IdempotencyCheckResult {
    const existing = this.memoryStore.get(namespacedKey);
    const now = Date.now();

    if (existing) {
      if (existing.expiresAt < now) {
        this.memoryStore.delete(namespacedKey);
      } else {
        if (existing.payloadHash !== payloadHash) {
          return { action: 'PAYLOAD_MISMATCH', cachedRecord: existing };
        }
        if (existing.status === 'PENDING') {
          return { action: 'IN_FLIGHT_CONFLICT', cachedRecord: existing };
        }
        return { action: 'REPLAY', cachedRecord: existing };
      }
    }

    const newRecord: IdempotencyRecord = {
      key,
      payloadHash,
      status: 'PENDING',
      statusCode: 0,
      responseBody: null,
      createdAt: now,
      expiresAt: now + config.lockMutexTtlSeconds * 1000,
    };

    this.memoryStore.set(namespacedKey, newRecord);
    return { action: 'PROCEED' };
  }
}

export const idempotencyService = new IdempotencyService();

