import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { roomRouter } from './routes/room.routes.js';
import { signalingGateway } from './gateways/signaling.gateway.js';

export const app = express();
export const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Healthcheck & diagnostic endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'conversio-signaling-server',
    timestamp: new Date().toISOString(),
  });
});

// REST API routes
app.use('/api/rooms', roomRouter);

// Initialize WebRTC Signaling Gateway (Socket.io)
signalingGateway.initialize(server);

// Start server if executed directly as the entry point
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('verify-idempotency')) {
  server.listen(config.port, () => {
    console.log(`[Conversio Server] Running on http://localhost:${config.port}`);
    console.log(`[Conversio Server] Signaling Gateway ready for WebRTC handshake.`);
  });
}
