import { eq, sql } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from './client';
import { runMigrations } from './migrate';
import { seedIfEmpty } from './seed';
import { orders, products } from './schema';
import { ProductsRepository } from '../modules/products/products.repository';

let database: Database;
afterEach(() => database.close());

/** The exact tables the API created before Drizzle (node:sqlite version). */
async function createLegacySchema(db: Database) {
  await db.db.run(sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL,
    price_cents INTEGER NOT NULL, rating REAL NOT NULL, stock INTEGER NOT NULL,
    emoji TEXT NOT NULL, hue INTEGER NOT NULL, position INTEGER NOT NULL)`);
  await db.db.run(sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
    customer_address TEXT NOT NULL, total_cents INTEGER NOT NULL, created_at TEXT NOT NULL)`);
  await db.db.run(sql`CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL)`);
}
const tableNames = async () => (await database.db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)).map((r) => r.name);

describe('runMigrations: fresh database', () => {
  it('creates the schema and is not a legacy adoption', async () => {
    database = await createDatabase(':memory:');
    expect(await runMigrations(database)).toEqual({ adoptedLegacy: false });
    expect(await tableNames()).toEqual(expect.arrayContaining(['products', 'orders', 'order_items', '__drizzle_migrations']));
  });

  it('is idempotent: running again changes nothing', async () => {
    database = await createDatabase(':memory:');
    await runMigrations(database);
    await seedIfEmpty(database);
    expect(await runMigrations(database)).toEqual({ adoptedLegacy: false });
    expect(await database.db.select().from(products)).toHaveLength(12);
  });
});

describe('runMigrations: database created before Drizzle (the "table already exists" crash)', () => {
  const seedLegacyData = async () => {
    await createLegacySchema(database);
    await database.db.run(sql`INSERT INTO products VALUES ('old-lamp', 'Old Lamp', 'from the old API', 'home', 4200, 4.4, 7, '💡', 50, 0)`);
    await database.db.run(sql`INSERT INTO orders VALUES ('ord_old', 'Ada', 'ada@example.com', '1 Analytical St', 4200, '2025-01-01T00:00:00.000Z')`);
    await database.db.run(sql`INSERT INTO order_items VALUES ('ord_old', 'old-lamp', 1, 4200)`);
  };

  it('no longer crashes: adopts the database and keeps every row', async () => {
    database = await createDatabase(':memory:');
    await seedLegacyData();

    expect(await runMigrations(database)).toEqual({ adoptedLegacy: true });
    expect(await database.db.select().from(products)).toHaveLength(1);
    expect((await database.db.select().from(orders).where(eq(orders.id, 'ord_old')))[0]).toMatchObject({ customerName: 'Ada', totalCents: 4200 });
    expect(await tableNames()).toContain('__drizzle_migrations');
  });

  it('also recovers from the failed first attempt: legacy tables + an EMPTY history table left behind', async () => {
    database = await createDatabase(':memory:');
    await seedLegacyData();
    // exactly what Drizzle leaves behind when its first migration crashes with "already exists"
    await database.db.run(sql`CREATE TABLE "__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)`);

    expect(await runMigrations(database)).toEqual({ adoptedLegacy: true });
    expect(await database.db.select().from(products)).toHaveLength(1);
    expect(await runMigrations(database)).toEqual({ adoptedLegacy: false });
  });

  it('adopts only once: the second start is a normal no-op', async () => {
    database = await createDatabase(':memory:');
    await seedLegacyData();
    await runMigrations(database);
    expect(await runMigrations(database)).toEqual({ adoptedLegacy: false });
  });

  it('the adopted database works with the new code (reads, guarded stock updates)', async () => {
    database = await createDatabase(':memory:');
    await seedLegacyData();
    await runMigrations(database);

    const repo = new ProductsRepository(database.db);
    expect(await repo.findById('old-lamp')).toMatchObject({ name: 'Old Lamp', stock: 7 });
    expect(await repo.decrementStock('old-lamp', 7)).toBe(true);
    expect(await repo.decrementStock('old-lamp', 1)).toBe(false);
    expect((await repo.list({ sort: 'featured', page: 1, pageSize: 8 })).total).toBe(1);
  });

  it('seeding still works afterwards and does not duplicate existing products', async () => {
    database = await createDatabase(':memory:');
    await seedLegacyData();
    await runMigrations(database);
    expect(await seedIfEmpty(database)).toEqual({ seeded: false }); // there is already 1 product
  });
});
