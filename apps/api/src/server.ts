import { mkdirSync } from 'node:fs';
import { buildApp } from './app.js';
import { createDb } from './db.js';

mkdirSync('data', { recursive: true });
const app = buildApp(createDb(process.env.DB_FILE ?? 'data/shop.sqlite'));
const port = Number(process.env.PORT ?? 4000);

app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
