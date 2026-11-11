import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/libsql/migrator';
import type { Database } from './client';

const MIGRATIONS_TABLE = '__drizzle_migrations';
const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url));

/**
 * A database file created by the API BEFORE Drizzle existed has our tables but no migration history, so the
 * first migration ("create tables") would fail with `table ... already exists`. Its tables already match that
 * migration (same columns), so we adopt it: record the baseline migration as applied and keep every row.
 * (It also repairs a file where that failed attempt already happened once: see the history-table note below.)
 */
async function adoptLegacyDatabase(database: Database): Promise<boolean> {
  const rows = await database.db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`);
  const tables = new Set(rows.map((r) => r.name));
  if (!tables.has('products')) return false; // fresh database: the normal migration creates everything

  // A history table is not proof of history: Drizzle creates it BEFORE running the first migration, so a
  // crashed first attempt (the very error this function fixes) leaves it behind EMPTY. Only rows count.
  if (tables.has(MIGRATIONS_TABLE)) {
    const [applied] = await database.db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM ${sql.identifier(MIGRATIONS_TABLE)}`);
    if ((applied?.n ?? 0) > 0) return false;
  }

  const [baseline] = readMigrationFiles({ migrationsFolder });
  if (!baseline) return false;
  // Same table definition Drizzle's migrator uses, so it picks the history up as if it had created it.
  await database.db.run(sql.raw(`CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)`));
  await database.db.run(sql`INSERT INTO ${sql.identifier(MIGRATIONS_TABLE)} ("hash", "created_at") VALUES (${baseline.hash}, ${baseline.folderMillis})`);
  return true;
}

/** Applies the SQL files in ./migrations that have not run yet (tracked in drizzle's own table). */
export async function runMigrations(database: Database): Promise<{ adoptedLegacy: boolean }> {
  const adoptedLegacy = await adoptLegacyDatabase(database);
  await migrate(database.db, { migrationsFolder });
  return { adoptedLegacy };
}
