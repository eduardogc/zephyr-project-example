import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { createDb } from './db.js';

let app: ReturnType<typeof buildApp>;
beforeEach(() => {
  process.env.NODE_ENV = 'test';
  app = buildApp(createDb());
});
afterEach(() => app.close());

describe('GET /api/products', () => {
  it('paginates and returns totals', async () => {
    const res = await app.inject('/api/products?pageSize=5');
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.items).toHaveLength(5);
    expect(body.total).toBe(12);
  });

  it('filters by category and search, and sorts by price', async () => {
    const res = await app.inject('/api/products?category=audio&sort=price-desc');
    const prices = res.json().items.map((p: { priceCents: number }) => p.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
    expect(res.json().total).toBe(3);

    const search = await app.inject('/api/products?search=lamp');
    expect(search.json().items.map((p: { id: string }) => p.id)).toEqual(['glow-lamp']);
  });

  it('rejects invalid query params', async () => {
    const res = await app.inject('/api/products?category=nope');
    expect(res.statusCode).toBe(400);
    expect(res.json().issues[0].path).toBe('category');
  });
});

describe('GET /api/products/:id', () => {
  it('404s for unknown products', async () => {
    expect((await app.inject('/api/products/nope')).statusCode).toBe(404);
  });
});

describe('POST /api/orders', () => {
  const customer = { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' };

  it('creates an order and decrements stock', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/orders',
      payload: { customer, items: [{ productId: 'smart-plug', quantity: 2 }] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().totalCents).toBe(7800);
    expect((await app.inject('/api/products/smart-plug')).json().stock).toBe(98);
  });

  it('rolls back when any line is out of stock', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/orders',
      payload: { customer, items: [{ productId: 'smart-plug', quantity: 1 }, { productId: 'usbc-hub', quantity: 1 }] },
    });
    expect(res.statusCode).toBe(409);
    expect((await app.inject('/api/products/smart-plug')).json().stock).toBe(100);
  });

  it('validates the body', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/orders', payload: { customer: { name: 'A' }, items: [] } });
    expect(res.statusCode).toBe(400);
  });
});
