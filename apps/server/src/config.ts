import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_HOSTS: z.string().default('localhost,127.0.0.1,localhost:4000,localhost:3000'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('conversio-development-secret-jwt-key-2026'),
  IDEMPOTENCY_TTL_SECONDS: z.string().default('86400').transform((v) => parseInt(v, 10)),
  LOCK_MUTEX_TTL_SECONDS: z.string().default('15').transform((v) => parseInt(v, 10)),
  LIVEKIT_URL: z.string().default('http://localhost:7880'),
  LIVEKIT_API_KEY: z.string().default('devkey'),
  LIVEKIT_API_SECRET: z.string().default('secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config Error] Invalid server environment configuration:');
  console.error(z.treeifyError(parsed.error));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const env = parsed.success ? parsed.data : envSchema.parse({});

// Security check: Guard against production deployment with default development secrets
if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET.includes('development') || env.JWT_SECRET.length < 32) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be set to a cryptographically strong secret in production!');
  }
}

export const config = Object.freeze({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  frontendUrl: env.FRONTEND_URL.replace(/\/$/, ''), // Clean trailing slash
  allowedHosts: env.ALLOWED_HOSTS.split(',').map((h) => h.trim().toLowerCase()),
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  idempotencyTtlSeconds: env.IDEMPOTENCY_TTL_SECONDS,
  lockMutexTtlSeconds: env.LOCK_MUTEX_TTL_SECONDS,
  livekitUrl: env.LIVEKIT_URL,
  livekitApiKey: env.LIVEKIT_API_KEY,
  livekitApiSecret: env.LIVEKIT_API_SECRET,
});
