import type { ErrorCode } from '@shop/types';
import { AppError, type ErrorIssue } from './app-error';

/** The request was understood, but a business rule or input constraint was violated. */
export class BusinessError extends AppError {
  readonly kind = 'business' as const;

  constructor(code: ErrorCode, statusCode: number, message: string, options?: { cause?: unknown }) {
    super(code, statusCode, message, options);
  }
}

export class BadRequestError extends BusinessError {
  constructor(message = 'Bad request', options?: { cause?: unknown }) {
    super('BAD_REQUEST', 400, message, options);
  }
}

export class ValidationError extends BusinessError {
  constructor(
    readonly issues: ErrorIssue[],
    message = 'Validation failed',
  ) {
    super('VALIDATION_ERROR', 400, message);
  }
}

export class NotFoundError extends BusinessError {
  constructor(message = 'Not found') {
    super('NOT_FOUND', 404, message);
  }
}

export class ConflictError extends BusinessError {
  constructor(message = 'Conflict') {
    super('CONFLICT', 409, message);
  }
}

export class OutOfStockError extends BusinessError {
  constructor(
    readonly productId: string,
    productName: string,
  ) {
    super('OUT_OF_STOCK', 409, `Not enough stock for ${productName}`);
  }
}
