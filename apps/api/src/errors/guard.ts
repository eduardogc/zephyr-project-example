import { AppError } from './app-error';
import { DatabaseError } from './server-errors';

/** Wraps a data-access call: our own typed errors pass through, anything else becomes a `DatabaseError`. */
export async function guardDb<T>(operation: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new DatabaseError(operation, { cause: err });
  }
}
