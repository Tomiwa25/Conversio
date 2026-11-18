import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { logger, httpLogger } from './logger.js';
import { hostHeaderGuard, errorHandler } from './middlewares/security.middleware.js';
import { roomRouter } from './routes/room.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { channelRouter } from './routes/channel.routes.js';
import { scheduleRouter } from './routes/schedule.routes.js';
import { signalingGateway } from './gateways/signaling.gateway.js';
import { db } from './db.js';

export const app = express();
export const server = http.createServer(app);

// 1. Structured HTTP access logging & correlation ID injection
app.use(httpLogger);

// 2. Defense against Host Header & Password Reset Poisoning
app.use(hostHeaderGuard);

// 3. Security Headers Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by client frontend
    crossOriginEmbedderPolicy: false,
  })
);

// 4. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Rate Limiting Protection (Relaxed in testing environments)
if (process.env.NODE_ENV !== 'test') {
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
      },
    },
  });

  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
}

// 6. Comprehensive Healthcheck & Fault-Tolerance Diagnostic Endpoint
app.get('/health', async (_req, res) => {
  const dbHealth = await db.checkHealth();
  const memory = process.memoryUsage();

  const isDegraded = config.databaseUrl && !dbHealth.isConnected;

  res.status(isDegraded ? 503 : 200).json({
    status: isDegraded ? 'degraded' : 'healthy',
    service: 'conversio-signaling-server',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    components: {
      database: {
        type: config.databaseUrl ? 'postgresql' : 'in-memory-fallback',
        connected: dbHealth.isConnected || !config.databaseUrl,
        latencyMs: dbHealth.latencyMs,
      },
      livekit: {
        url: config.livekitUrl,
        enabled: Boolean(config.livekitApiKey),
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
    },
  });
});

// 7. REST API routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/channels', channelRouter);
app.use('/api/schedule', scheduleRouter);

// 8. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

// 10. Initialize WebRTC Signaling Gateway (Socket.io)
signalingGateway.initialize(server);

// 11. Graceful Process Termination & Unhandled Rejection Safeguards
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection detected:', reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception thrown:', err);
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully stopping Conversio server...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await db.close();
    logger.info('Database pool terminated.');
    process.exit(0);
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown timeout reached. Terminating process.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server if executed directly as the entry point
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('verify-')) {
  server.listen(config.port, () => {
    logger.info(`[Conversio Server] Running on http://localhost:${config.port}`);
    logger.info(`[Conversio Server] Signaling Gateway ready for WebRTC handshake.`);
  });
}
