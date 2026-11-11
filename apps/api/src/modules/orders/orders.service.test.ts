import { describe, expect, it, vi } from 'vitest';
import type { OrderInput, Product } from '@shop/types';
import { NotFoundError, OutOfStockError, ValidationError } from '../../errors';
import { MAX_QUANTITY_PER_PRODUCT, OrdersService, mergeLines, type OrderRepos, type UnitOfWork } from './orders.service';

const product = (id: string, over: Partial<Product> = {}): Product => ({
  id, name: `Product ${id}`, description: 'd', category: 'home', priceCents: 1000, rating: 4, stock: 10, emoji: '📦', hue: 1, ...over,
});
const customer = { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' };
const input = (items: OrderInput['items']): OrderInput => ({ customer, items });

/** Everything the service touches is faked: no database, no HTTP. */
function setup(catalogue: Product[], { decrement = true }: { decrement?: boolean | ((id: string) => boolean) } = {}) {
  const repos = {
    products: {
      findManyByIds: vi.fn(async (ids: string[]) => catalogue.filter((p) => ids.includes(p.id))),
      decrementStock: vi.fn(async (id: string) => (typeof decrement === 'function' ? decrement(id) : decrement)),
    },
    orders: { create: vi.fn(async () => {}) },
  } satisfies OrderRepos;
  const unitOfWorkSpy = vi.fn(); // records how many transactions were opened
  const unitOfWork: UnitOfWork = (work) => {
    unitOfWorkSpy();
    return work(repos);
  };
  const service = new OrdersService({ unitOfWork, now: () => new Date('2026-05-05T10:00:00Z'), newId: () => 'ord_test' });
  return { service, repos, unitOfWork: unitOfWorkSpy };
}

describe('mergeLines', () => {
  it('sums quantities of the same product and keeps order', () => {
    expect(mergeLines([{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 2 }, { productId: 'a', quantity: 3 }])).toEqual([
      { productId: 'a', quantity: 4 },
      { productId: 'b', quantity: 2 },
    ]);
  });
});

describe('OrdersService.create: happy path', () => {
  it('prices from the catalogue, decrements stock and stores the order, all inside ONE unit of work', async () => {
    const { service, repos, unitOfWork } = setup([product('a', { priceCents: 1500 }), product('b', { priceCents: 500 })]);
    const order = await service.create(input([{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }]));

    expect(order).toEqual({ id: 'ord_test', totalCents: 3500, createdAt: '2026-05-05T10:00:00.000Z' });
    expect(unitOfWork).toHaveBeenCalledTimes(1);
    expect(repos.products.decrementStock.mock.calls).toEqual([['a', 2], ['b', 1]]);
    expect(repos.orders.create).toHaveBeenCalledWith(
      { id: 'ord_test', totalCents: 3500, createdAt: '2026-05-05T10:00:00.000Z', customerName: 'Ada Lovelace', customerEmail: 'ada@example.com', customerAddress: '1 Analytical St' },
      [{ productId: 'a', quantity: 2, unitPriceCents: 1500 }, { productId: 'b', quantity: 1, unitPriceCents: 500 }],
    );
  });

  it('merges duplicate cart lines into one order line', async () => {
    const { service, repos } = setup([product('a')]);
    const order = await service.create(input([{ productId: 'a', quantity: 2 }, { productId: 'a', quantity: 3 }]));
    expect(order.totalCents).toBe(5000);
    expect(repos.products.decrementStock.mock.calls).toEqual([['a', 5]]);
  });

  it('allows ordering exactly the remaining stock', async () => {
    const { service } = setup([product('a', { stock: 3 })]);
    await expect(service.create(input([{ productId: 'a', quantity: 3 }]))).resolves.toMatchObject({ totalCents: 3000 });
  });
});

describe('OrdersService.create: business rules', () => {
  it('rejects unknown products with NotFoundError and writes nothing', async () => {
    const { service, repos } = setup([product('a')]);
    const err = await service.create(input([{ productId: 'a', quantity: 1 }, { productId: 'ghost', quantity: 1 }])).catch((e) => e);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.message).toBe('Unknown product: ghost');
    expect(repos.products.decrementStock).not.toHaveBeenCalled();
    expect(repos.orders.create).not.toHaveBeenCalled();
  });

  it('rejects when stock is too low with OutOfStockError naming the product', async () => {
    const { service, repos } = setup([product('a', { name: 'Aero Buds', stock: 1 })]);
    const err = await service.create(input([{ productId: 'a', quantity: 2 }])).catch((e) => e);
    expect(err).toBeInstanceOf(OutOfStockError);
    expect(err).toMatchObject({ code: 'OUT_OF_STOCK', statusCode: 409, productId: 'a', message: 'Not enough stock for Aero Buds' });
    expect(repos.orders.create).not.toHaveBeenCalled();
  });

  it('checks stock against the MERGED quantity, not per cart line', async () => {
    const { service } = setup([product('a', { stock: 4 })]);
    await expect(service.create(input([{ productId: 'a', quantity: 3 }, { productId: 'a', quantity: 3 }]))).rejects.toBeInstanceOf(OutOfStockError);
  });

  it(`caps a product at ${MAX_QUANTITY_PER_PRODUCT} units after merging lines (ValidationError, before touching the database)`, async () => {
    const { service, unitOfWork } = setup([product('a', { stock: 100 })]);
    const err = await service.create(input([{ productId: 'a', quantity: 6 }, { productId: 'a', quantity: 6 }])).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.issues[0]).toMatchObject({ path: 'items' });
    expect(unitOfWork).not.toHaveBeenCalled();
  });

  it('turns a lost stock race (guarded decrement returns false) into OutOfStockError', async () => {
    const { service, repos } = setup([product('a'), product('b', { name: 'Bee' })], { decrement: (id) => id !== 'b' });
    const err = await service.create(input([{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 1 }])).catch((e) => e);
    expect(err).toMatchObject({ code: 'OUT_OF_STOCK', productId: 'b', message: 'Not enough stock for Bee' });
    expect(repos.orders.create).not.toHaveBeenCalled(); // the unit of work will roll the first decrement back
  });
});

describe('OrdersService.create: failures', () => {
  it('propagates repository failures so the unit of work can roll back', async () => {
    const { service, repos } = setup([product('a')]);
    const boom = new Error('disk full');
    repos.orders.create.mockRejectedValueOnce(boom);
    await expect(service.create(input([{ productId: 'a', quantity: 1 }]))).rejects.toBe(boom);
  });
});
