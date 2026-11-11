import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES, type Product } from '@shop/types';
import { NotFoundError } from '../../errors';
import { registerErrorHandler } from '../../plugins/error-handler';
import { productsRoutes } from './products.routes';
import type { ProductsService } from './products.service';

const product: Product = { id: 'p', name: 'P', description: 'd', category: 'home', priceCents: 100, rating: 4, stock: 1, emoji: '📦', hue: 1 };

// Routes only: the service is a fake, so this tests HTTP concerns (parsing, status codes, shapes).
function setup(service: Partial<ProductsService>) {
  const app = Fastify();
  registerErrorHandler(app);
  app.register(productsRoutes(service as ProductsService), { prefix: '/api' });
  return app;
}
let app: ReturnType<typeof setup>;
afterEach(() => app.close());

describe('GET /api/products', () => {
  it('parses the query string (with defaults and coercion) before calling the service', async () => {
    const list = vi.fn().mockResolvedValue({ items: [product], total: 1, page: 2, pageSize: 4 });
    app = setup({ list });
    const res = await app.inject('/api/products?search=lamp&category=home&sort=rating&page=2&pageSize=4');
    expect(res.statusCode).toBe(200);
    expect(list).toHaveBeenCalledWith({ search: 'lamp', category: 'home', sort: 'rating', page: 2, pageSize: 4 });

    await app.inject('/api/products');
    expect(list).toHaveBeenLastCalledWith({ sort: 'featured', page: 1, pageSize: 8 });
  });

  it('returns 400 VALIDATION_ERROR with the failing paths, without touching the service', async () => {
    const list = vi.fn();
    app = setup({ list });
    const res = await app.inject('/api/products?category=nope&page=0');
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDATION_ERROR', error: 'Validation failed' });
    expect(res.json().issues.map((i: { path: string }) => i.path).sort()).toEqual(['category', 'page']);
    expect(list).not.toHaveBeenCalled();
  });
});

describe('GET /api/products/:id', () => {
  it('returns the product', async () => {
    const getById = vi.fn().mockResolvedValue(product);
    app = setup({ getById });
    const res = await app.inject('/api/products/p');
    expect(res.json()).toEqual(product);
    expect(getById).toHaveBeenCalledWith('p');
  });

  it('maps the service NotFoundError to a 404 body', async () => {
    app = setup({ getById: vi.fn().mockRejectedValue(new NotFoundError('Product not found')) });
    const res = await app.inject('/api/products/ghost');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Product not found', code: 'NOT_FOUND' });
  });
});

describe('GET /api/categories', () => {
  it('lists the categories', async () => {
    app = setup({});
    expect((await app.inject('/api/categories')).json()).toEqual([...CATEGORIES]);
  });
});
