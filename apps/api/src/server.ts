import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app';
import { loadConfig } from './config';
import { createContainer } from './container';
import { createDatabase } from './db/client';
import { runMigrations } from './db/migrate';
import { seedIfEmpty } from './db/seed';

const config = loadConfig();
if (config.dbFile !== ':memory:') mkdirSync(dirname(config.dbFile), { recursive: true });

const database = await createDatabase(config.dbFile);
await runMigrations(database);
await seedIfEmpty(database);

const app = buildApp(createContainer(database), { logLevel: config.logLevel });

const shutdown = async () => {
  await app.close();
  database.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen({ port: config.port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
