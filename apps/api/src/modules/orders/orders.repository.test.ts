import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../test/helpers';
import type { Database } from '../../db/client';
import { orderItems, orders } from '../../db/schema';
import { DatabaseError } from '../../errors';
import { OrdersRepository } from './orders.repository';

let database: Database;
let repo: OrdersRepository;
const order = { id: 'ord_1', customerName: 'Ada', customerEmail: 'ada@example.com', customerAddress: '1 Analytical St', totalCents: 3000, createdAt: '2026-01-01T00:00:00.000Z' };

beforeEach(async () => {
  database = await createTestDatabase();
  repo = new OrdersRepository(database.db);
});
afterEach(() => database.close());

describe('OrdersRepository.create', () => {
  it('persists the order and its items', async () => {
    await repo.create(order, [
      { productId: 'aero-buds', quantity: 2, unitPriceCents: 12900 },
      { productId: 'glow-lamp', quantity: 1, unitPriceCents: 6900 },
    ]);
    expect(await database.db.select().from(orders)).toEqual([order]);
    const items = await database.db.select().from(orderItems).where(eq(orderItems.orderId, 'ord_1'));
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.productId === 'aero-buds')).toEqual({ orderId: 'ord_1', productId: 'aero-buds', quantity: 2, unitPriceCents: 12900 });
  });

  it('reports database failures (unknown product -> foreign key) as a DatabaseError', async () => {
    await expect(repo.create(order, [{ productId: 'ghost', quantity: 1, unitPriceCents: 1 }])).rejects.toBeInstanceOf(DatabaseError);
  });

  it('rejects duplicate ids and zero quantities at the database level', async () => {
    await repo.create(order, [{ productId: 'aero-buds', quantity: 1, unitPriceCents: 1 }]);
    await expect(repo.create(order, [{ productId: 'aero-buds', quantity: 1, unitPriceCents: 1 }])).rejects.toBeInstanceOf(DatabaseError);
    await expect(repo.create({ ...order, id: 'ord_2' }, [{ productId: 'aero-buds', quantity: 0, unitPriceCents: 1 }])).rejects.toBeInstanceOf(DatabaseError);
  });
});
