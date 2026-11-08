import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  redisUrl: process.env.REDIS_URL || undefined,
  jwtSecret: process.env.JWT_SECRET || 'conversio-development-secret-jwt-key-2026',
  idempotencyTtlSeconds: parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '86400', 10), // 24 hours
  lockMutexTtlSeconds: parseInt(process.env.LOCK_MUTEX_TTL_SECONDS || '15', 10),
};

