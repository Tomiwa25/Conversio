import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { channelService } from '../services/channel.service.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/security.middleware.js';

export const channelRouter = Router();

const createChannelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  isPrivate: z.boolean().optional(),
});

const postMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  attachments: z.array(z.any()).optional(),
});

channelRouter.use(optionalAuth);

// GET /api/channels - List available channels
channelRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const channels = await channelService.listChannels(userId);
    res.status(200).json({ channels });
  })
);

// POST /api/channels - Create a channel
channelRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const parseResult = createChannelSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
      return;
    }

    const createdBy = req.user?.userId;
    const channel = await channelService.createChannel({
      ...parseResult.data,
      createdBy,
    });

    res.status(201).json({ channel });
  })
);

// GET /api/channels/:id/messages - Retrieve message history
channelRouter.get(
  '/:id/messages',
  asyncHandler(async (req: Request, res: Response) => {
    const channelId = req.params.id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const messages = await channelService.getChannelMessages(channelId, limit);
    res.status(200).json({ messages });
  })
);

// POST /api/channels/:id/messages - Post message to channel
channelRouter.post(
  '/:id/messages',
  asyncHandler(async (req: Request, res: Response) => {
    const channelId = req.params.id as string;
    const parseResult = postMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
      return;
    }

    const senderId = req.user?.userId || (req.body.senderId as string) || 'anonymous-user';
    const senderName = req.user?.name || (req.body.senderName as string) || 'Anonymous';

    const message = await channelService.postChannelMessage({
      channelId,
      senderId,
      senderName,
      content: parseResult.data.content,
      attachments: parseResult.data.attachments,
    });

    res.status(201).json({ message });
  })
);

// GET /api/channels/direct/:userId - Retrieve DM conversation
channelRouter.get(
  '/direct/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user?.userId || (req.query.currentUserId as string);
    const otherUserId = req.params.userId as string;

    if (!currentUserId) {
      res.status(400).json({ error: 'currentUserId is required to fetch direct messages' });
      return;
    }

    const messages = await channelService.getDirectMessages(currentUserId, otherUserId);
    res.status(200).json({ messages });
  })
);

// POST /api/channels/direct/:userId - Send DM
channelRouter.post(
  '/direct/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const recipientId = req.params.userId as string;
    const senderId = req.user?.userId || (req.body.senderId as string);
    const senderName = req.user?.name || (req.body.senderName as string) || 'Anonymous';

    if (!senderId) {
      res.status(400).json({ error: 'senderId is required' });
      return;
    }

    const parseResult = postMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
      return;
    }

    const message = await channelService.sendDirectMessage({
      senderId,
      recipientId,
      content: parseResult.data.content,
      attachments: parseResult.data.attachments,
    });

    res.status(201).json({ message });
  })
);
