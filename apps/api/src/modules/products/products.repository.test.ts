import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { productQuerySchema } from '@shop/types';
import { createTestDatabase } from '../../test/helpers';
import { DatabaseError } from '../../errors';
import type { Database } from '../../db/client';
import { ProductsRepository } from './products.repository';

let database: Database;
let repo: ProductsRepository;
const query = (q: Record<string, unknown> = {}) => productQuerySchema.parse(q);

beforeEach(async () => {
  database = await createTestDatabase();
  repo = new ProductsRepository(database.db);
});
afterEach(() => database.close());

describe('ProductsRepository.list', () => {
  it('paginates and reports the total', async () => {
    const page1 = await repo.list(query({ pageSize: 5 }));
    const page3 = await repo.list(query({ pageSize: 5, page: 3 }));
    expect(page1).toMatchObject({ total: 12, page: 1, pageSize: 5 });
    expect(page1.items).toHaveLength(5);
    expect(page3.items).toHaveLength(2);
    expect(new Set([...page1.items, ...page3.items].map((p) => p.id)).size).toBe(7);
  });

  it('keeps featured order by default', async () => {
    expect((await repo.list(query())).items.slice(0, 2).map((p) => p.id)).toEqual(['aero-buds', 'studio-cans']);
  });

  it.each([
    ['price-asc', (a: number, b: number) => a - b, 'priceCents'],
    ['price-desc', (a: number, b: number) => b - a, 'priceCents'],
    ['rating', (a: number, b: number) => b - a, 'rating'],
  ] as const)('sorts by %s', async (sort, cmp, field) => {
    const values = (await repo.list(query({ sort, pageSize: 50 }))).items.map((p) => p[field]);
    expect(values).toEqual([...values].sort(cmp));
  });

  it('filters by category and reports the filtered total', async () => {
    const result = await repo.list(query({ category: 'audio' }));
    expect(result.total).toBe(3);
    expect(result.items.every((p) => p.category === 'audio')).toBe(true);
  });

  it('searches name and description, case-insensitively', async () => {
    expect((await repo.list(query({ search: 'LAMP' }))).items.map((p) => p.id)).toEqual(['glow-lamp']);
    expect((await repo.list(query({ search: 'waterproof' }))).items.map((p) => p.id)).toEqual(['pocket-speaker']); // description only
  });

  it('combines search and category', async () => {
    expect((await repo.list(query({ search: 'noise', category: 'home' }))).total).toBe(0);
    expect((await repo.list(query({ search: 'noise', category: 'audio' }))).total).toBe(1);
  });

  it('treats % and _ in the search text literally, not as wildcards', async () => {
    expect((await repo.list(query({ search: '%' }))).total).toBe(0);
    expect((await repo.list(query({ search: 'a_r' }))).total).toBe(0); // would match "Aer..." if _ were a wildcard
  });

  it('survives SQL-looking input', async () => {
    expect((await repo.list(query({ search: "'; DROP TABLE products; --" }))).total).toBe(0);
    expect((await repo.list(query())).total).toBe(12);
  });
});

describe('ProductsRepository lookups', () => {
  it('findById returns a product, or undefined', async () => {
    expect(await repo.findById('aero-buds')).toMatchObject({ name: 'Aero Buds Pro', priceCents: 12900, category: 'audio' });
    expect(await repo.findById('nope')).toBeUndefined();
  });

  it('findManyByIds returns only the ones that exist', async () => {
    expect((await repo.findManyByIds(['aero-buds', 'nope', 'glow-lamp'])).map((p) => p.id).sort()).toEqual(['aero-buds', 'glow-lamp']);
    expect(await repo.findManyByIds([])).toEqual([]);
  });

  it('does not expose internal columns like position', async () => {
    expect(Object.keys((await repo.findById('aero-buds'))!)).not.toContain('position');
  });
});

describe('ProductsRepository.decrementStock', () => {
  it('takes stock when enough is available', async () => {
    expect(await repo.decrementStock('smart-plug', 40)).toBe(true);
    expect((await repo.findById('smart-plug'))?.stock).toBe(60);
  });

  it('can take exactly the remaining stock, but not one more', async () => {
    expect(await repo.decrementStock('studio-cans', 9)).toBe(true); // had 9
    expect(await repo.decrementStock('studio-cans', 1)).toBe(false);
    expect((await repo.findById('studio-cans'))?.stock).toBe(0);
  });

  it('refuses, and changes nothing, when stock is too low or the product is unknown', async () => {
    expect(await repo.decrementStock('vision-glasses', 6)).toBe(false); // had 5
    expect((await repo.findById('vision-glasses'))?.stock).toBe(5);
    expect(await repo.decrementStock('ghost', 1)).toBe(false);
  });
});

describe('ProductsRepository error handling', () => {
  it('wraps database failures in a DatabaseError', async () => {
    database.close();
    await expect(repo.findById('aero-buds')).rejects.toBeInstanceOf(DatabaseError);
    database = await createTestDatabase(); // keep afterEach happy
  });
});
