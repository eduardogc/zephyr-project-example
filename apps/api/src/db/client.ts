import { createClient } from '@libsql/client';
import type { ResultSet } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema';

/** What repositories talk to: the database itself OR a transaction (they share the same query API). */
export type Executor = BaseSQLiteDatabase<'async', ResultSet, typeof schema>;

export type Database = Awaited<ReturnType<typeof createDatabase>>;

/** `file` is a path or ':memory:' (each in-memory database is private to its connection: ideal for tests). */
export async function createDatabase(file: string) {
  const client = createClient({ url: file === ':memory:' ? file : `file:${file}` });
  await client.execute('PRAGMA foreign_keys = ON');
  const db = drizzle(client, { schema });

  // The client has ONE connection and refuses overlapping transactions (TRANSACTION_ACTIVE), while SQLite
  // only allows one writer at a time anyway. So transactions are queued and run strictly one after another.
  let queue: Promise<unknown> = Promise.resolve();
  const transaction = <T>(work: (tx: Executor) => Promise<T>): Promise<T> => {
    const run = queue.then(() => db.transaction((tx) => work(tx)));
    queue = run.catch(() => undefined); // a failed transaction must not block the ones behind it
    return run;
  };

  return {
    db,
    schema,
    /** Run `work` atomically: commits on success, rolls back if it throws. Concurrent calls are serialised. */
    transaction,
    ping: async () => void (await client.execute('SELECT 1')),
    close: () => client.close(),
  };
}
