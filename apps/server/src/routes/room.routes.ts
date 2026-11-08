import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { roomService } from '../services/room.service.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { signalingGateway } from '../gateways/signaling.gateway.js';

const createRoomSchema = z.object({
  title: z.string().min(1, 'Room title is required').max(100),
  hostId: z.string().min(1, 'Host ID is required'),
  maxParticipants: z.number().int().positive().max(500).optional(),
});

const lockRoomSchema = z.object({
  isLocked: z.boolean(),
  userId: z.string().min(1, 'User ID is required'),
  expectedVersion: z.number().int().nonnegative(),
});

export const roomRouter = Router();

// POST /api/rooms - Idempotent Room Creation
roomRouter.post('/', idempotencyMiddleware, (req: Request, res: Response) => {
  const parseResult = createRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const room = roomService.createRoom(parseResult.data);
  res.status(201).json({ room });
});

// GET /api/rooms/:id - Retrieve Room Details
roomRouter.get('/:id', (req: Request, res: Response) => {
  const room = roomService.getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.status(200).json({ room });
});

// POST /api/rooms/:id/lock - Optimistic Concurrency Room Lock Control
roomRouter.post('/:id/lock', (req: Request, res: Response) => {
  const parseResult = lockRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const result = roomService.setRoomLock(req.params.id, parseResult.data);

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

