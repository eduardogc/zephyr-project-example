import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiRequestError } from './index';

const product = { id: 'aero-buds', name: 'Aero', description: 'd', category: 'audio', priceCents: 100, rating: 4, stock: 3, emoji: '🎧', hue: 1 };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fetchMock = vi.fn();
beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('api.listProducts', () => {
  it('builds the query string, skipping empty values', async () => {
    fetchMock.mockImplementation(async () => json({ items: [product], total: 1, page: 2, pageSize: 8 })); // fresh Response per call
    const page = await api.listProducts({ search: 'lamp', category: 'audio', sort: 'rating', page: 2, pageSize: 8 });
    expect(page.items).toHaveLength(1);
    const url = new URL(fetchMock.mock.calls[0]![0], 'http://x');
    expect(url.pathname).toBe('/api/products');
    expect(Object.fromEntries(url.searchParams)).toEqual({ search: 'lamp', category: 'audio', sort: 'rating', page: '2', pageSize: '8' });

    await api.listProducts({ search: '', category: undefined });
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/products?');
  });

  it('rejects a response that does not match the schema', async () => {
    fetchMock.mockResolvedValue(json({ items: [{ nope: true }], total: 1, page: 1, pageSize: 8 }));
    await expect(api.listProducts()).rejects.toThrow();
  });
});

describe('api.getProduct', () => {
  it('encodes the id and parses the product', async () => {
    fetchMock.mockResolvedValue(json(product));
    expect((await api.getProduct('a b')).id).toBe('aero-buds');
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/products/a%20b');
  });

  it('throws ApiRequestError with the status for 404s', async () => {
    fetchMock.mockResolvedValue(json({ error: 'Product not found' }, 404));
    const err = await api.getProduct('x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err).toMatchObject({ status: 404, message: 'Product not found', issues: [] });
  });
});

describe('api.createOrder', () => {
  const input = {
    customer: { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' },
    items: [{ productId: 'aero-buds', quantity: 1 }],
  };

  it('POSTs JSON and parses the order', async () => {
    fetchMock.mockResolvedValue(json({ id: 'ord_1', totalCents: 100, createdAt: '2026-01-01T00:00:00Z' }, 201));
    expect((await api.createOrder(input)).id).toBe('ord_1');
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(input);
    expect(init.headers['content-type']).toBe('application/json');
  });

  it('surfaces validation issues from the server', async () => {
    fetchMock.mockResolvedValue(json({ error: 'Validation failed', issues: [{ path: 'customer.email', message: 'Invalid email' }] }, 400));
    const err = (await api.createOrder(input).catch((e) => e)) as ApiRequestError;
    expect(err.status).toBe(400);
    expect(err.issues).toEqual([{ path: 'customer.email', message: 'Invalid email' }]);
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }));
    await expect(api.createOrder(input)).rejects.toMatchObject({ status: 502, message: 'Bad Gateway' });
  });
});
