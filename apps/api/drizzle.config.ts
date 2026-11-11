import { defineConfig } from 'drizzle-kit';

// `pnpm --filter shop-api db:generate` diffs schema.ts against the last migration and writes new SQL.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
});
