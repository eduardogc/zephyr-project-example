// Service + repositories + REAL (in-memory) database: proves the transaction and stock guarantees.
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OrderInput } from '@shop/types';
import { createContainer } from '../../container';
import type { Database } from '../../db/client';
import { orderItems, orders, products } from '../../db/schema';
import { NotFoundError, OutOfStockError } from '../../errors';
import { createTestDatabase } from '../../test/helpers';

let database: Database;
let service: ReturnType<typeof createContainer>['ordersService'];
const customer = { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' };
const order = (...items: OrderInput['items']): OrderInput => ({ customer, items });
const stockOf = async (id: string) => (await database.db.select().from(products).where(eq(products.id, id)))[0]?.stock;

beforeEach(async () => {
  database = await createTestDatabase();
  service = createContainer(database).ordersService;
});
afterEach(() => database.close());

describe('placing an order', () => {
  it('stores the order, its lines at catalogue prices, and decrements stock', async () => {
    const result = await service.create(order({ productId: 'smart-plug', quantity: 2 }, { productId: 'glow-lamp', quantity: 1 }));
    expect(result.totalCents).toBe(2 * 3900 + 6900);

    expect(await database.db.select().from(orders).where(eq(orders.id, result.id))).toHaveLength(1);
    const lines = await database.db.select().from(orderItems).where(eq(orderItems.orderId, result.id));
    expect(lines.map((l) => [l.productId, l.quantity, l.unitPriceCents]).sort()).toEqual([['glow-lamp', 1, 6900], ['smart-plug', 2, 3900]]);
    expect(await stockOf('smart-plug')).toBe(98);
    expect(await stockOf('glow-lamp')).toBe(32);
  });
});

describe('all or nothing', () => {
  it('an out-of-stock line aborts the whole order: nothing written, no stock lost', async () => {
    const err = await service.create(order({ productId: 'smart-plug', quantity: 1 }, { productId: 'usbc-hub', quantity: 1 })).catch((e) => e); // hub: 0 in stock
    expect(err).toBeInstanceOf(OutOfStockError);
    expect(await stockOf('smart-plug')).toBe(100);
    expect(await database.db.select().from(orders)).toHaveLength(0);
    expect(await database.db.select().from(orderItems)).toHaveLength(0);
  });

  it('an unknown product aborts the whole order', async () => {
    await expect(service.create(order({ productId: 'smart-plug', quantity: 1 }, { productId: 'ghost', quantity: 1 }))).rejects.toBeInstanceOf(NotFoundError);
    expect(await stockOf('smart-plug')).toBe(100);
  });

  it('a failure AFTER stock was decremented rolls the decrement back', async () => {
    // Force the failure at the very end: make the order insert fail on a duplicate id.
    const { ordersService } = createContainer(database);
    await database.db.insert(orders).values({ id: 'ord_dupe', customerName: 'x', customerEmail: 'x@y.z', customerAddress: 'x', totalCents: 1, createdAt: 'now' });
    const { OrdersService } = await import('./orders.service');
    const { OrdersRepository } = await import('./orders.repository');
    const { ProductsRepository } = await import('../products/products.repository');
    const failing = new OrdersService({
      newId: () => 'ord_dupe',
      unitOfWork: (work) => database.transaction((tx) => work({ products: new ProductsRepository(tx), orders: new OrdersRepository(tx) })),
    });
    await expect(failing.create(order({ productId: 'smart-plug', quantity: 5 }))).rejects.toMatchObject({ code: 'DATABASE_ERROR' });
    expect(await stockOf('smart-plug')).toBe(100); // the decrement was undone
    expect(ordersService).toBeDefined();
  });
});

describe('concurrency', () => {
  it('two orders racing for the last unit: exactly one wins, stock never goes negative', async () => {
    await database.db.update(products).set({ stock: 1 }).where(eq(products.id, 'smart-plug'));
    const results = await Promise.allSettled([
      service.create(order({ productId: 'smart-plug', quantity: 1 })),
      service.create(order({ productId: 'smart-plug', quantity: 1 })),
    ]);
    const won = results.filter((r) => r.status === 'fulfilled');
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect(lost[0]!.reason).toBeInstanceOf(OutOfStockError);
    expect(await stockOf('smart-plug')).toBe(0);
    expect(await database.db.select().from(orders)).toHaveLength(1);
  });

  it('many parallel orders never oversell', async () => {
    await database.db.update(products).set({ stock: 5 }).where(eq(products.id, 'smart-plug'));
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => service.create(order({ productId: 'smart-plug', quantity: 1 }))));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
    expect(await stockOf('smart-plug')).toBe(0);
    expect(await database.db.select().from(orderItems)).toHaveLength(5);
  });
});
