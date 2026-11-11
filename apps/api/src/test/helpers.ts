import { buildApp } from '../app';
import { createContainer } from '../container';
import { createDatabase } from '../db/client';
import { runMigrations } from '../db/migrate';
import { seedIfEmpty } from '../db/seed';

/** A fresh, migrated, seeded in-memory database. */
export async function createTestDatabase({ seed = true } = {}) {
  const database = await createDatabase(':memory:');
  await runMigrations(database);
  if (seed) await seedIfEmpty(database);
  return database;
}

/** The full app on top of a private in-memory database. */
export async function createTestApp() {
  const database = await createTestDatabase();
  const app = buildApp(createContainer(database), { logLevel: 'silent' });
  await app.ready();
  return { app, database, close: async () => { await app.close(); database.close(); } };
}
