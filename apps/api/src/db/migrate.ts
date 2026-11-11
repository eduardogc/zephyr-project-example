import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/libsql/migrator';
import type { Database } from './client';

/** Applies the SQL files in ./migrations that have not run yet (tracked in drizzle's own table). */
export async function runMigrations(database: Database) {
  await migrate(database.db, { migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)) });
}
