import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { roomService } from '../services/room.service.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { signalingGateway } from '../gateways/signaling.gateway.js';
import { authService } from '../services/auth.service.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const createRoomSchema = z.object({
  title: z.string().min(1, 'Room title is required').max(100),
  hostId: z.string().min(1, 'Host ID is required'),
  hostName: z.string().min(1).default('Host'),
  maxParticipants: z.number().int().positive().max(500).optional(),
});

const joinRoomSchema = z.object({
  name: z.string().min(1, 'Participant name is required'),
  userId: z.string().optional(),
});

const lockRoomSchema = z.object({
  isLocked: z.boolean(),
  userId: z.string().min(1, 'User ID is required'),
  expectedVersion: z.number().int().nonnegative(),
});

export const roomRouter = Router();

roomRouter.use(optionalAuth);

// POST /api/rooms - Idempotent Room Creation with Cryptographic Host Token
roomRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response) => {
  const parseResult = createRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  // Use authenticated user ID if present; fallback to body hostId
  const verifiedHostId = req.user?.userId || parseResult.data.hostId;
  const verifiedHostName = req.user?.name || parseResult.data.hostName;

  const room = await roomService.createRoom({
    ...parseResult.data,
    hostId: verifiedHostId,
  });

  // Issue cryptographic Host Admission Token
  const token = authService.generateRoomToken({
    roomId: room.id,
    userId: verifiedHostId,
    name: verifiedHostName,
    role: 'host',
  });

  res.status(201).json({
    room,
    token,
    userId: verifiedHostId,
    role: 'host',
  });
});

// POST /api/rooms/:id/join - Issue Cryptographic Participant Admission Token
roomRouter.post('/:id/join', async (req: Request, res: Response) => {
  const roomId = req.params.id as string;
  const room = await roomService.getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const parseResult = joinRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  // Pre-join lock check
  if (room.lockState.isLocked) {
    res.status(403).json({
      error: 'This room is currently locked by the host. Entry denied.',
      code: 'ROOM_LOCKED',
    });
    return;
  }

  const userId = parseResult.data.userId || `user-${crypto.randomUUID().slice(0, 8)}`;
  const token = authService.generateRoomToken({
    roomId: room.id,
    userId,
    name: parseResult.data.name,
    role: 'participant',
  });

  res.status(200).json({
    room,
    token,
    userId,
    role: 'participant',
  });
});

// GET /api/rooms/:id - Retrieve Room Details
roomRouter.get('/:id', async (req: Request, res: Response) => {
  const roomId = req.params.id as string;
  const room = await roomService.getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.status(200).json({ room });
});

// POST /api/rooms/:id/lock - Optimistic Concurrency Room Lock Control with Token Auth
roomRouter.post('/:id/lock', async (req: Request, res: Response) => {
  const roomId = req.params.id as string;
  const parseResult = lockRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  // Token verification (Bearer header or body token)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.body.token as string | undefined);

  if (token) {
    const verified = authService.verifyRoomToken(token);
    if (!verified || verified.roomId !== roomId || verified.role !== 'host') {
      res.status(403).json({ error: 'Unauthorized: Invalid host authorization token.' });
      return;
    }
  }

  const result = await roomService.setRoomLock(roomId, parseResult.data);

  if (!result.success) {
    if (result.versionMismatch) {
      res.status(409).json({ error: result.error, versionMismatch: true });
      return;
    }
    if (result.error?.includes('host')) {
      res.status(403).json({ error: result.error });
      return;
    }
    res.status(404).json({ error: result.error });
    return;
  }

  // Broadcast lock state to all active peers in the room via Signaling Gateway
  if (result.room) {
    signalingGateway.broadcastLockUpdate(result.room.id, result.room.lockState);
  }

  res.status(200).json({
    message: `Room successfully ${parseResult.data.isLocked ? 'locked' : 'unlocked'}`,
    room: result.room,
  });
});
