import { count } from 'drizzle-orm';
import type { Database } from './client';
import { products } from './schema';
import { SEED_PRODUCTS } from './seed-data';

/** Inserts the demo catalogue once. Safe to call on every start: does nothing if products exist. */
export async function seedIfEmpty(database: Database) {
  const [row] = await database.db.select({ n: count() }).from(products);
  if ((row?.n ?? 0) > 0) return { seeded: false as const };
  await database.db.insert(products).values(SEED_PRODUCTS.map((p, position) => ({ ...p, position })));
  return { seeded: true as const, count: SEED_PRODUCTS.length };
}
