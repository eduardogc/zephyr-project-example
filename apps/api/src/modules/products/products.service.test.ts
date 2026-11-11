import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@shop/types';
import { NotFoundError } from '../../errors';
import { ProductsService } from './products.service';

const product: Product = { id: 'p', name: 'P', description: 'd', category: 'home', priceCents: 100, rating: 4, stock: 1, emoji: '📦', hue: 1 };

describe('ProductsService (repository faked, no database)', () => {
  it('list() delegates to the repository with the query', async () => {
    const page = { items: [product], total: 1, page: 1, pageSize: 8 };
    const repo = { list: vi.fn().mockResolvedValue(page), findById: vi.fn() };
    const query = { sort: 'featured', page: 1, pageSize: 8 } as const;
    expect(await new ProductsService(repo).list(query)).toBe(page);
    expect(repo.list).toHaveBeenCalledWith(query);
  });

  it('getById() returns the product', async () => {
    const repo = { list: vi.fn(), findById: vi.fn().mockResolvedValue(product) };
    expect(await new ProductsService(repo).getById('p')).toBe(product);
  });

  it('getById() throws a business NotFoundError for unknown products', async () => {
    const repo = { list: vi.fn(), findById: vi.fn().mockResolvedValue(undefined) };
    const err = await new ProductsService(repo).getById('ghost').catch((e) => e);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toMatchObject({ kind: 'business', code: 'NOT_FOUND', statusCode: 404, message: 'Product not found' });
  });

  it('lets repository failures propagate unchanged', async () => {
    const boom = new Error('db down');
    const repo = { list: vi.fn().mockRejectedValue(boom), findById: vi.fn() };
    await expect(new ProductsService(repo).list({ sort: 'featured', page: 1, pageSize: 8 })).rejects.toBe(boom);
  });
});
