// The whole stack over HTTP (routes -> services -> repositories -> Drizzle -> SQLite), no fakes.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { apiErrorSchema, orderSchema, productPageSchema, productSchema } from '@shop/types';
import { createTestApp } from './test/helpers';

let ctx: Awaited<ReturnType<typeof createTestApp>>;
beforeEach(async () => void (ctx = await createTestApp()));
afterEach(() => ctx.close());

const customer = { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' };
const post = (payload: object) => ctx.app.inject({ method: 'POST', url: '/api/orders', payload });

describe('read endpoints', () => {
  it('GET /health reports the database', async () => {
    expect((await ctx.app.inject('/health')).json()).toEqual({ status: 'ok', database: 'up' });
  });

  it('GET /api/products returns pages that satisfy the shared schema', async () => {
    const res = await ctx.app.inject('/api/products?pageSize=5&sort=price-desc');
    const page = productPageSchema.parse(res.json());
    expect(page).toMatchObject({ total: 12, page: 1, pageSize: 5 });
    expect(page.items.map((p) => p.priceCents)).toEqual([...page.items.map((p) => p.priceCents)].sort((a, b) => b - a));
  });

  it('GET /api/products/:id returns a product, 404 otherwise, both in the shared formats', async () => {
    expect(productSchema.parse((await ctx.app.inject('/api/products/aero-buds')).json()).name).toBe('Aero Buds Pro');
    const missing = await ctx.app.inject('/api/products/nope');
    expect(missing.statusCode).toBe(404);
    expect(apiErrorSchema.parse(missing.json())).toEqual({ error: 'Product not found', code: 'NOT_FOUND' });
  });
});

describe('POST /api/orders', () => {
  it('creates an order, visible in stock immediately', async () => {
    const res = await post({ customer, items: [{ productId: 'smart-plug', quantity: 2 }] });
    expect(res.statusCode).toBe(201);
    expect(orderSchema.parse(res.json()).totalCents).toBe(7800);
    expect((await ctx.app.inject('/api/products/smart-plug')).json().stock).toBe(98);
  });

  it('409 OUT_OF_STOCK when a line cannot be fulfilled, and nothing is taken', async () => {
    const res = await post({ customer, items: [{ productId: 'smart-plug', quantity: 1 }, { productId: 'usbc-hub', quantity: 1 }] });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: 'Not enough stock for USB-C Hub 8-in-1', code: 'OUT_OF_STOCK' });
    expect((await ctx.app.inject('/api/products/smart-plug')).json().stock).toBe(100);
  });

  it('404 NOT_FOUND for unknown products', async () => {
    const res = await post({ customer, items: [{ productId: 'ghost', quantity: 1 }] });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });

  it('400 VALIDATION_ERROR for bad input, and for >10 units of one product', async () => {
    const bad = await post({ customer: { name: 'A' }, items: [] });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().code).toBe('VALIDATION_ERROR');

    const many = await post({ customer, items: [{ productId: 'smart-plug', quantity: 6 }, { productId: 'smart-plug', quantity: 6 }] });
    expect(many.statusCode).toBe(400);
    expect(many.json().issues[0].path).toBe('items');
  });
});

describe('server failures', () => {
  it('a dead database yields a typed 500 with no internals', async () => {
    ctx.database.close();
    const res = await ctx.app.inject('/api/products');
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'Internal server error', code: 'DATABASE_ERROR' });
  });
});
