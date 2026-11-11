import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OutOfStockError } from '../../errors';
import { registerErrorHandler } from '../../plugins/error-handler';
import { ordersRoutes } from './orders.routes';
import type { OrdersService } from './orders.service';

const customer = { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' };
const valid = { customer, items: [{ productId: 'aero-buds', quantity: 2 }] };

function setup(create: ReturnType<typeof vi.fn>) {
  const app = Fastify();
  registerErrorHandler(app);
  app.register(ordersRoutes({ create } as unknown as OrdersService), { prefix: '/api' });
  return app;
}
let app: ReturnType<typeof setup>;
afterEach(() => app.close());

describe('POST /api/orders', () => {
  it('returns 201 with the created order', async () => {
    const order = { id: 'ord_1', totalCents: 25800, createdAt: '2026-01-01T00:00:00.000Z' };
    const create = vi.fn().mockResolvedValue(order);
    app = setup(create);
    const res = await app.inject({ method: 'POST', url: '/api/orders', payload: valid });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(order);
    expect(create).toHaveBeenCalledWith(valid);
  });

  it('validates the body: 400 with one issue per bad field, service untouched', async () => {
    const create = vi.fn();
    app = setup(create);
    const res = await app.inject({ method: 'POST', url: '/api/orders', payload: { customer: { name: 'A', email: 'x', address: 'y' }, items: [] } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
    expect(res.json().issues.map((i: { path: string }) => i.path).sort()).toEqual(['customer.address', 'customer.email', 'customer.name', 'items']);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a missing body and malformed JSON as 400', async () => {
    app = setup(vi.fn());
    expect((await app.inject({ method: 'POST', url: '/api/orders' })).statusCode).toBe(400);
    const bad = await app.inject({ method: 'POST', url: '/api/orders', headers: { 'content-type': 'application/json' }, payload: '{nope' });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().code).toBe('BAD_REQUEST');
  });

  it('maps business errors from the service (409 OUT_OF_STOCK)', async () => {
    app = setup(vi.fn().mockRejectedValue(new OutOfStockError('aero-buds', 'Aero Buds Pro')));
    const res = await app.inject({ method: 'POST', url: '/api/orders', payload: valid });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: 'Not enough stock for Aero Buds Pro', code: 'OUT_OF_STOCK' });
  });
});
