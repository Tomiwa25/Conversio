import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { roomRouter } from './routes/room.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { channelRouter } from './routes/channel.routes.js';
import { scheduleRouter } from './routes/schedule.routes.js';
import { signalingGateway } from './gateways/signaling.gateway.js';

export const app = express();
export const server = http.createServer(app);

// 1. Comprehensive Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
        mediaSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  })
);

// 2. Strict Cross-Origin Resource Sharing with Credentials (Cookies)
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
  })
);

// 3. Request Body Limiter (Preventing large payload memory exhaustion attacks)
app.use(express.json({ limit: '250kb' }));

// 4. Rate Limiting Protection (Relaxed during automated unit tests)
if (process.env.NODE_ENV !== 'test') {
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  });

  const roomCreationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many room requests. Please retry in a few moments.' },
  });

  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
  app.use('/api/rooms', roomCreationLimiter);
}

// 5. Healthcheck & Telemetry Diagnostic Endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'conversio-signaling-server',
    timestamp: new Date().toISOString(),
  });
});

// 6. REST API routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/channels', channelRouter);
app.use('/api/schedule', scheduleRouter);

// 7. Initialize WebRTC Signaling Gateway (Socket.io)
signalingGateway.initialize(server);

// Start server if executed directly as the entry point
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('verify-')) {
  server.listen(config.port, () => {
    console.log(`[Conversio Server] Running on http://localhost:${config.port}`);
    console.log(`[Conversio Server] Signaling Gateway ready for WebRTC handshake.`);
  });
}
