import { Request, Response, NextFunction } from 'express';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { idempotencyService } from '../services/idempotency.service.js';

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const idempotencyKey = req.headers[IDEMPOTENCY_HEADER] as string | undefined;

  // If no idempotency key provided, proceed normally
  if (!idempotencyKey) {
    next();
    return;
  }

  try {
    const check = await idempotencyService.acquireOrReplay(idempotencyKey, req.body);

    if (check.action === 'REPLAY' && check.cachedRecord) {
      res.setHeader('x-idempotency-replayed', 'true');
      res.status(check.cachedRecord.statusCode).json(check.cachedRecord.responseBody);
      return;
    }

    if (check.action === 'IN_FLIGHT_CONFLICT') {
      res.status(409).json({
        error: 'Conflict: A request with this idempotency key is already in flight. Please retry shortly.',
      });
      return;
    }

    if (check.action === 'PAYLOAD_MISMATCH') {
      res.status(422).json({
        error: 'Unprocessable Entity: Idempotency key was previously submitted with a different request payload.',
      });
      return;
    }

    // Intercept response to resolve and cache once the controller finishes
    const originalJson = res.json.bind(res);
    let capturedBody: unknown = null;

    res.json = (body: unknown) => {
      capturedBody = body;
      return originalJson(body);
    };

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 400 && capturedBody !== null) {
        await idempotencyService.resolve(idempotencyKey, res.statusCode, capturedBody);
      } else {
        // If request failed with 4xx/5xx or unhandled, release lock so user can retry cleanly
        await idempotencyService.fail(idempotencyKey);
      }
    });

    next();
  } catch (error) {
    await idempotencyService.fail(idempotencyKey);
    next(error);
  }
};

