import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'jwtsecret',
  'livekitapisecret',
  'passcode',
]);

function redactSensitive(obj: any, depth = 0): any {
  if (!obj || depth > 4) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitive(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  private isProduction = process.env.NODE_ENV === 'production';

  public setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITIES[level] >= LEVEL_PRIORITIES[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, meta?: any, err?: Error | unknown): string {
    const timestamp = new Date().toISOString();
    const cleanMeta = meta ? redactSensitive(meta) : undefined;
    const errorDetails =
      err instanceof Error
        ? { message: err.message, stack: this.isProduction ? undefined : err.stack }
        : err;

    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...(cleanMeta ? { meta: cleanMeta } : {}),
        ...(errorDetails ? { error: errorDetails } : {}),
      });
    }

    // Development colorized console format
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m[DEBUG]\x1b[0m',
      info: '\x1b[32m[INFO]\x1b[0m',
      warn: '\x1b[33m[WARN]\x1b[0m',
      error: '\x1b[31m[ERROR]\x1b[0m',
    };

    const prefix = `${timestamp} ${levelColors[level]}`;
    const metaStr = cleanMeta ? `\n  Meta: ${JSON.stringify(cleanMeta)}` : '';
    const errStr =
      err instanceof Error && err.stack
        ? `\n  Error: ${err.stack}`
        : err
        ? `\n  Error: ${JSON.stringify(err)}`
        : '';

    return `${prefix} ${message}${metaStr}${errStr}`;
  }

  public debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatEntry('debug', message, meta));
    }
  }

  public info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatEntry('info', message, meta));
    }
  }

  public warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatEntry('warn', message, meta));
    }
  }

  public error(message: string, err?: Error | unknown, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatEntry('error', message, meta, err));
    }
  }
}

export const logger = new Logger();

/**
 * Express Request Correlation & HTTP Access Logging Middleware
 */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const correlationId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  (req as any).id = correlationId;
  res.setHeader('X-Request-Id', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    // Skip excessively noisy polling endpoints in test/dev
    if (req.originalUrl === '/health' && process.env.NODE_ENV === 'test') {
      return;
    }

    const logPayload = {
      requestId: correlationId,
      method: req.method,
      path: req.originalUrl,
      status: statusCode,
      durationMs: duration,
      ip: req.ip || req.socket.remoteAddress,
      userId: (req as any).user?.userId,
    };

    if (level === 'error') {
      logger.error(`HTTP ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, undefined, logPayload);
    } else if (level === 'warn') {
      logger.warn(`HTTP ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, logPayload);
    } else {
      logger.info(`HTTP ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, logPayload);
    }
  });

  next();
}
