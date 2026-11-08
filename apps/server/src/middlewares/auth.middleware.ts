import { Request, Response, NextFunction } from 'express';
import { UserTokenPayload } from '@conversio/shared';
import { authService } from '../services/auth.service.js';

// Extend Express Request type with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

/**
 * Enforce authenticated user access token
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.slice(7);
  const payload = authService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Invalid or expired authentication token.',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Optional user authentication: attaches user if token valid, allows guest if absent
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = authService.verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
