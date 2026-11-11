import type { ApiError } from '@shop/types';
import { ZodError } from 'zod';
import { AppError } from './app-error';
import { BadRequestError, NotFoundError, ValidationError } from './business-errors';
import { ServerError } from './server-errors';

export const PUBLIC_SERVER_MESSAGE = 'Internal server error';

/** Anything thrown anywhere -> one of our typed errors. Unknown things become `ServerError`s. */
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return new ValidationError(err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }

  // Fastify's own errors (malformed JSON, payload too large, ...) carry a 4xx statusCode.
  const status = (err as { statusCode?: number } | null)?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return status === 404 ? new NotFoundError((err as Error).message) : new BadRequestError((err as Error).message, { cause: err });
  }

  return new ServerError('Unhandled error', { cause: err });
}

/** The exact HTTP response for an error. Server errors never leak their message or cause. */
export function toApiError(err: AppError): { statusCode: number; body: ApiError } {
  if (err.kind === 'server') {
    return { statusCode: err.statusCode, body: { error: PUBLIC_SERVER_MESSAGE, code: err.code } };
  }
  const body: ApiError = { error: err.message, code: err.code };
  if (err instanceof ValidationError) body.issues = err.issues;
  return { statusCode: err.statusCode, body };
}
