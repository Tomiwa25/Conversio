import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { config } from '../config.js';

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
  refreshToken: z.string().optional(),
});

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// POST /api/auth/register - Create New User Account with Secure Cookie Setting
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

    // Set HttpOnly, Secure, SameSite refresh cookie
    res.cookie('refreshToken', authResponse.refreshToken, cookieOptions);

    res.status(201).json(authResponse);
  } catch (err: any) {
    res.status(409).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login - User Authentication with Secure Cookie Setting
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

    // Set HttpOnly, Secure, SameSite refresh cookie
    res.cookie('refreshToken', authResponse.refreshToken, cookieOptions);

    res.status(200).json(authResponse);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid email or password' });
  }
});

// POST /api/auth/refresh - Rotate Tokens via Secure HttpOnly Cookie or Body
authRouter.post('/refresh', async (req: Request, res: Response) => {
  // Extract refresh token from cookie or request body
  let token = req.body?.refreshToken as string | undefined;
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/refreshToken=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  if (!token) {
    res.status(401).json({ error: 'Refresh token is required' });
    return;
  }

  const payload = authService.verifyRefreshToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const user = await authService.getUserById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'User profile not found' });
    return;
  }

  const tokens = authService.generateUserTokens(user);
  await authService.storeRefreshToken(user.id, tokens.refreshToken);

  // Set fresh HttpOnly refresh cookie
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

  res.status(200).json({
    user,
    ...tokens,
  });
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

// POST /api/auth/logout - Revoke Refresh Token Session & Clear Cookie
authRouter.post('/logout', async (req: Request, res: Response) => {
  let tokenToRevoke = req.body?.refreshToken as string | undefined;
  if (!tokenToRevoke && req.headers.cookie) {
    const match = req.headers.cookie.match(/refreshToken=([^;]+)/);
    if (match) tokenToRevoke = decodeURIComponent(match[1]);
  }

  if (tokenToRevoke) {
    await authService.revokeRefreshToken(tokenToRevoke);
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json({ message: 'Logged out successfully.' });
});
