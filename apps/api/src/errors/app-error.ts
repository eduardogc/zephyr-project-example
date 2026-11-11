import type { ErrorCode } from '@shop/types';

/**
 * Two families, so handlers can decide what to expose and what to log:
 * - `business`: a rule was violated by the request (4xx). Message is safe to show to users.
 * - `server`:   something broke on our side (5xx). Message is generic; the cause is only logged.
 */
export type ErrorKind = 'business' | 'server';

export type ErrorIssue = { path: string; message: string };

export abstract class AppError extends Error {
  abstract readonly kind: ErrorKind;

  protected constructor(
    readonly code: ErrorCode,
    readonly statusCode: number,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}
