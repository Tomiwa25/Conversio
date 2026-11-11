import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { scheduleService } from '../services/schedule.service.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

export const scheduleRouter = Router();

const scheduleMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  hostId: z.string().optional(),
  roomId: z.string().optional(),
  scheduledStart: z.string().datetime({ offset: true }).or(z.string().min(10)),
  scheduledEnd: z.string().datetime({ offset: true }).or(z.string().min(10)),
  timezone: z.string().default('UTC'),
  passcode: z.string().optional(),
  recurrenceRule: z.string().optional(),
  invitees: z.array(z.string()).optional(),
});

scheduleRouter.use(optionalAuth);

// GET /api/schedule - Retrieve user agenda
scheduleRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.userId || (req.query.userId as string);
  if (!userId) {
    res.status(400).json({ error: 'User ID is required to fetch scheduled meetings' });
    return;
  }

  const meetings = await scheduleService.listUserMeetings(userId);
  res.status(200).json({ meetings });
});

// POST /api/schedule - Schedule a new meeting
scheduleRouter.post('/', async (req: Request, res: Response) => {
  const parseResult = scheduleMeetingSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    return;
  }

  const hostId = req.user?.userId || parseResult.data.hostId;
  if (!hostId) {
    res.status(400).json({ error: 'Host ID is required to schedule a meeting' });
    return;
  }

  const meeting = await scheduleService.scheduleMeeting({
    ...parseResult.data,
    hostId,
  });

  res.status(201).json({ meeting });
});

// GET /api/schedule/:id - Retrieve meeting details
scheduleRouter.get('/:id', async (req: Request, res: Response) => {
  const meetingId = req.params.id as string;
  const meeting = await scheduleService.getMeeting(meetingId);
  if (!meeting) {
    res.status(404).json({ error: 'Scheduled meeting not found' });
    return;
  }
  res.status(200).json({ meeting });
});

// DELETE /api/schedule/:id - Cancel a meeting
scheduleRouter.delete('/:id', async (req: Request, res: Response) => {
  const meetingId = req.params.id as string;
  const userId = req.user?.userId || (req.body.userId as string);

  if (!userId) {
    res.status(401).json({ error: 'User authentication required to cancel meeting' });
    return;
  }

  const success = await scheduleService.cancelMeeting(meetingId, userId);
  if (!success) {
    res.status(403).json({ error: 'Failed to cancel meeting or unauthorized' });
    return;
  }

  res.status(200).json({ message: 'Meeting successfully cancelled' });
});
