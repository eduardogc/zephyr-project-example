import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../test/helpers';
import { SEED_PRODUCTS } from './seed-data';
import { seedIfEmpty } from './seed';
import { orderItems, orders, products } from './schema';
import type { Database } from './client';

let database: Database;
afterEach(() => database.close());

describe('migrations + seed', () => {
  it('creates the schema and seeds the catalogue', async () => {
    database = await createTestDatabase();
    const rows = await database.db.select().from(products).orderBy(products.position);
    expect(rows).toHaveLength(SEED_PRODUCTS.length);
    expect(rows[0]?.id).toBe(SEED_PRODUCTS[0]?.id);
  });

  it('seeding is idempotent', async () => {
    database = await createTestDatabase();
    expect(await seedIfEmpty(database)).toEqual({ seeded: false });
    expect(await database.db.select().from(products)).toHaveLength(SEED_PRODUCTS.length);
  });

  it('can start empty and seed explicitly', async () => {
    database = await createTestDatabase({ seed: false });
    expect(await database.db.select().from(products)).toHaveLength(0);
    expect(await seedIfEmpty(database)).toEqual({ seeded: true, count: SEED_PRODUCTS.length });
  });
});

describe('database guarantees', () => {
  it('refuses negative stock (CHECK constraint)', async () => {
    database = await createTestDatabase();
    await expect(database.db.update(products).set({ stock: -1 }).where(eq(products.id, 'smart-plug'))).rejects.toThrow();
  });

  it('enforces foreign keys on order items', async () => {
    database = await createTestDatabase();
    await database.db.insert(orders).values({ id: 'o1', customerName: 'A', customerEmail: 'a@b.c', customerAddress: 'x', totalCents: 1, createdAt: 'now' });
    await expect(database.db.insert(orderItems).values({ orderId: 'o1', productId: 'ghost', quantity: 1, unitPriceCents: 1 })).rejects.toThrow();
  });

  it('transaction() commits on success and rolls back when the work throws', async () => {
    database = await createTestDatabase();
    const stock = async () => (await database.db.select().from(products).where(eq(products.id, 'smart-plug')))[0]?.stock;

    await expect(
      database.transaction(async (tx) => {
        await tx.update(products).set({ stock: 1 }).where(eq(products.id, 'smart-plug'));
        throw new Error('abort');
      }),
    ).rejects.toThrow('abort');
    expect(await stock()).toBe(100);

    await database.transaction(async (tx) => void (await tx.update(products).set({ stock: 7 }).where(eq(products.id, 'smart-plug'))));
    expect(await stock()).toBe(7);
  });

  it('serialises overlapping transactions instead of failing with TRANSACTION_ACTIVE', async () => {
    database = await createTestDatabase();
    const order: string[] = [];
    const run = (name: string, ms: number, fail = false) =>
      database.transaction(async (tx) => {
        order.push(`${name}:start`);
        await tx.select().from(products).limit(1);
        await new Promise((r) => setTimeout(r, ms));
        order.push(`${name}:end`);
        if (fail) throw new Error(`${name} failed`);
      });
    const results = await Promise.allSettled([run('a', 20, true), run('b', 5), run('c', 1)]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'fulfilled', 'fulfilled']); // a failing one does not block the rest
    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end']); // never interleaved
  });

  it('ping() resolves while the database is open', async () => {
    database = await createTestDatabase();
    await expect(database.ping()).resolves.toBeUndefined();
  });
});
