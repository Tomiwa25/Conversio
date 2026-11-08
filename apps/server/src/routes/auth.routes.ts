import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(64, 'Name too long'),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// POST /api/auth/register - Create New User Account
authRouter.post('/register', async (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  try {
    const { name, email, password } = parseResult.data;
    const authResponse = await authService.register(name, email, password);
    res.status(201).json(authResponse);
  } catch (err: any) {
    res.status(409).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login - User Authentication
authRouter.post('/login', async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
    return;
  }

  try {
    const { email, password } = parseResult.data;
    const authResponse = await authService.login(email, password);
    res.status(200).json(authResponse);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid email or password' });
  }
});

// GET /api/auth/me - Retrieve Current Authenticated Profile
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const profile = await authService.getUserById(req.user.userId);
  if (!profile) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  res.status(200).json({ user: profile });
});

// POST /api/auth/logout - Revoke Refresh Token Session
authRouter.post('/logout', async (req: Request, res: Response) => {
  const parseResult = refreshTokenSchema.safeParse(req.body);
  if (parseResult.success) {
    await authService.revokeRefreshToken(parseResult.data.refreshToken);
  }
  res.status(200).json({ message: 'Logged out successfully.' });
});
