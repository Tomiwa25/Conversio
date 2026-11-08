export const IDEMPOTENCY_HEADER = 'x-idempotency-key';

export type IdempotencyStatus = 'PENDING' | 'RESOLVED' | 'FAILED';

export interface IdempotencyRecord<T = unknown> {
  key: string;
  payloadHash: string;
  status: IdempotencyStatus;
  statusCode: number;
  responseBody: T;
  createdAt: number;
  expiresAt: number;
}

export interface IdempotencyCheckResult<T = unknown> {
  action: 'PROCEED' | 'REPLAY' | 'IN_FLIGHT_CONFLICT' | 'PAYLOAD_MISMATCH';
  cachedRecord?: IdempotencyRecord<T>;
}

