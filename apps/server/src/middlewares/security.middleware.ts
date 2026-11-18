import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Host Header Whitelist Guard (Defends against Host Header Poisoning and Cache Poisoning)
 */
export function hostHeaderGuard(req: Request, res: Response, next: NextFunction): void {
  // Relaxed only if wildcard host is explicitly configured
  if (config.allowedHosts.includes('*')) {
    next();
    return;
  }

  const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
  const cleanHost = hostHeader.split(':')[0].toLowerCase().trim();

  // Strip ports for comparison if needed
  const isAllowed = config.allowedHosts.some((allowed) => {
    const cleanAllowed = allowed.split(':')[0].toLowerCase().trim();
    return cleanHost === cleanAllowed || cleanHost.endsWith(`.${cleanAllowed}`);
  });

  if (!isAllowed && hostHeader) {
    logger.warn(`Rejected suspicious Host header: "${hostHeader}" from IP ${req.ip}`);
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_HOST_HEADER',
        message: 'Untrusted or invalid Host header detected.',
      },
    });
    return;
  }

  next();
}

/**
 * Async Handler Wrapper for Express Routes
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Centralized Application Error Handling Middleware
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.status || err.statusCode || 500;
  const correlationId = (req as any).id || req.headers['x-request-id'] || 'unknown';

  logger.error(`Unhandled error during request [${correlationId}]:`, err, {
    method: req.method,
    url: req.originalUrl,
    statusCode,
  });

  const isProduction = config.nodeEnv === 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      message: isProduction && statusCode >= 500 ? 'An unexpected server error occurred.' : err.message || 'Error',
      correlationId,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
