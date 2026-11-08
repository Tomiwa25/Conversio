import crypto from 'node:crypto';
import Redis from 'ioredis';
import { IdempotencyCheckResult, IdempotencyRecord } from '@conversio/shared';
import { config } from '../config.js';

export class IdempotencyService {
  private redisClient: Redis | null = null;
  private memoryStore: Map<string, IdempotencyRecord> = new Map();

  constructor() {
    if (config.redisUrl) {
      try {
        this.redisClient = new Redis(config.redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
        this.redisClient.connect().catch((err) => {
          console.warn('[IdempotencyService] Redis connection failed, using in-memory store:', err.message);
          this.redisClient = null;
        });
      } catch (err) {
        console.warn('[IdempotencyService] Redis init failed, falling back to memory:', err);
      }
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

    if (this.redisClient) {
      return this.acquireRedis(namespacedKey, key, payloadHash, ttlSeconds);
    }

    return this.acquireMemory(namespacedKey, key, payloadHash, ttlSeconds);
  }

  public async resolve(
    key: string,
    statusCode: number,
    responseBody: unknown,
    ttlSeconds: number = config.idempotencyTtlSeconds
  ): Promise<void> {
    const namespacedKey = `idempotency:${key}`;
    const now = Date.now();

    if (this.redisClient) {
      const raw = await this.redisClient.get(namespacedKey);
      if (raw) {
        const record: IdempotencyRecord = JSON.parse(raw);
        record.status = 'RESOLVED';
        record.statusCode = statusCode;
        record.responseBody = responseBody;
        record.expiresAt = now + ttlSeconds * 1000;
        await this.redisClient.set(namespacedKey, JSON.stringify(record), 'EX', ttlSeconds);
      }
      return;
    }

    const record = this.memoryStore.get(namespacedKey);
    if (record) {
      record.status = 'RESOLVED';
      record.statusCode = statusCode;
      record.responseBody = responseBody;
      record.expiresAt = now + ttlSeconds * 1000;
    }
  }

  public async fail(key: string): Promise<void> {
    const namespacedKey = `idempotency:${key}`;
    if (this.redisClient) {
      await this.redisClient.del(namespacedKey);
      return;
    }
    this.memoryStore.delete(namespacedKey);
  }

  private async acquireRedis(
    namespacedKey: string,
    key: string,
    payloadHash: string,
    ttlSeconds: number
  ): Promise<IdempotencyCheckResult> {
    if (!this.redisClient) {
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

