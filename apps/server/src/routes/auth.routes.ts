import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/security.middleware.js';
import { config } from '../config.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Dedicated rate limiting for password reset actions (Relaxed in testing)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Strict 5 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset attempts. Please try again in 15 minutes.',
    },
  },
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(64, 'Name too long'),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email address is required').max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32, 'Invalid token length').max(128),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// POST /api/auth/register - Create New User Account
authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Registration validation failed',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    try {
      const { name, email, password } = parseResult.data;
      const authResponse = await authService.register(name, email, password);
      res.cookie('refreshToken', authResponse.refreshToken, cookieOptions);
      res.status(201).json({ success: true, ...authResponse });
    } catch (err: any) {
      res.status(409).json({
        success: false,
        error: {
          code: 'REGISTRATION_CONFLICT',
          message: err.message || 'Registration failed',
        },
      });
    }
  })
);

// POST /api/auth/login - User Authentication
authRouter.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid credentials format',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    try {
      const { email, password } = parseResult.data;
      const authResponse = await authService.login(email, password);
      res.cookie('refreshToken', authResponse.refreshToken, cookieOptions);
      res.status(200).json({ success: true, ...authResponse });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: err.message || 'Invalid email or password',
        },
      });
    }
  })
);

// POST /api/auth/forgot-password - Secure Password Reset Initiation (Anti-Poisoning)
authRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Valid email is required',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    // Notice: We strictly pass only the validated email. The reset URL is generated
    // server-side using config.frontendUrl, preventing any Host header poisoning attack.
    const result = await authService.requestPasswordReset(parseResult.data.email);
    res.status(200).json({
      success: true,
      ...result,
    });
  })
);

// POST /api/auth/reset-password - Complete Password Reset with Single-Use Token Verification
authRouter.post(
  '/reset-password',
  passwordResetLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Password reset validation failed',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    try {
      const { token, newPassword } = parseResult.data;
      await authService.resetPassword(token, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password has been successfully updated. All previous sessions have been signed out.',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: err.message || 'Failed to reset password',
        },
      });
    }
  })
);

// POST /api/auth/refresh - Rotate Tokens via Secure HttpOnly Cookie or Body
authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    let token = req.body?.refreshToken as string | undefined;
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/refreshToken=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Refresh token is required' } });
      return;
    }

    const payload = authService.verifyRefreshToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } });
      return;
    }

    const user = await authService.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const tokens = authService.generateUserTokens(user);
    await authService.storeRefreshToken(user.id, tokens.refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      user,
      ...tokens,
    });
  })
);

// GET /api/auth/me - Retrieve Current Authenticated Profile
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    const profile = await authService.getUserById(req.user.userId);
    if (!profile) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    res.status(200).json({ success: true, user: profile });
  })
);

// POST /api/auth/logout - Revoke Refresh Token Session & Clear Cookie
authRouter.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    let tokenToRevoke = req.body?.refreshToken as string | undefined;
    if (!tokenToRevoke && req.headers.cookie) {
      const match = req.headers.cookie.match(/refreshToken=([^;]+)/);
      if (match) tokenToRevoke = decodeURIComponent(match[1]);
    }

    if (tokenToRevoke) {
      await authService.revokeRefreshToken(tokenToRevoke);
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  })
);
