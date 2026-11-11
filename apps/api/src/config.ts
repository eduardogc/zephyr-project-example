import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  /** Path of the SQLite file, or ':memory:'. */
  DB_FILE: z.string().min(1).default('data/shop.sqlite'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
});

export type Config = ReturnType<typeof loadConfig>;

/** Parses and validates the environment once, at startup: a bad value fails fast with a clear message. */
export function loadConfig(env: Record<string, string | undefined> = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${problems}`);
  }
  const { NODE_ENV, PORT, DB_FILE, LOG_LEVEL } = parsed.data;
  return {
    env: NODE_ENV,
    port: PORT,
    dbFile: DB_FILE,
    logLevel: LOG_LEVEL ?? (NODE_ENV === 'test' ? 'silent' : 'info'),
  };
}
