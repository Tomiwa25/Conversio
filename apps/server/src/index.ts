import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { roomRouter } from './routes/room.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { signalingGateway } from './gateways/signaling.gateway.js';

export const app = express();
export const server = http.createServer(app);

// Security Headers Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by client frontend
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Rate Limiting Protection (Relaxed in testing environments)
if (process.env.NODE_ENV !== 'test') {
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  });

  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
}

// Healthcheck & diagnostic endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'conversio-signaling-server',
    timestamp: new Date().toISOString(),
  });
});

// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);

// Initialize WebRTC Signaling Gateway (Socket.io)
signalingGateway.initialize(server);

// Start server if executed directly as the entry point
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('verify-')) {
  server.listen(config.port, () => {
    console.log(`[Conversio Server] Running on http://localhost:${config.port}`);
    console.log(`[Conversio Server] Signaling Gateway ready for WebRTC handshake.`);
  });
}
