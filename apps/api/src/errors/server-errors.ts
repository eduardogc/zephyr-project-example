import { AppError } from './app-error';

/** Something failed on our side. `message` is for logs; clients only ever get a generic text. */
export class ServerError extends AppError {
  readonly kind = 'server' as const;

  constructor(message = 'Unexpected server error', options?: { cause?: unknown }) {
    super('INTERNAL_ERROR', 500, message, options);
  }
}

/** A database operation failed (connection, constraint, SQL error...). */
export class DatabaseError extends AppError {
  readonly kind = 'server' as const;

  constructor(
    readonly operation: string,
    options?: { cause?: unknown },
  ) {
    super('DATABASE_ERROR', 500, `Database operation failed: ${operation}`, options);
  }
}
