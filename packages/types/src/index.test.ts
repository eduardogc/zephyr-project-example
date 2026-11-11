import { describe, expect, it } from 'vitest';
import { apiErrorSchema, formatPrice, isBusinessErrorCode, orderInputSchema, productPageSchema, productQuerySchema, productSchema } from './index';

describe('productQuerySchema', () => {
  it('applies defaults', () => {
    expect(productQuerySchema.parse({})).toEqual({ sort: 'featured', page: 1, pageSize: 8 });
  });

  it('coerces numeric strings from the query string', () => {
    expect(productQuerySchema.parse({ page: '3', pageSize: '12' })).toMatchObject({ page: 3, pageSize: 12 });
  });

  it('trims search and rejects bad values', () => {
    expect(productQuerySchema.parse({ search: '  lamp ' }).search).toBe('lamp');
    expect(productQuerySchema.safeParse({ category: 'nope' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ sort: 'cheapest' }).success).toBe(false);
  });
});

describe('orderInputSchema', () => {
  const valid = {
    customer: { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical St' },
    items: [{ productId: 'aero-buds', quantity: 2 }],
  };

  it('accepts a valid order', () => {
    expect(orderInputSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['short name', { ...valid, customer: { ...valid.customer, name: 'A' } }, 'customer.name'],
    ['bad email', { ...valid, customer: { ...valid.customer, email: 'nope' } }, 'customer.email'],
    ['short address', { ...valid, customer: { ...valid.customer, address: 'x' } }, 'customer.address'],
    ['empty cart', { ...valid, items: [] }, 'items'],
    ['zero quantity', { ...valid, items: [{ productId: 'a', quantity: 0 }] }, 'items.0.quantity'],
    ['quantity above 10', { ...valid, items: [{ productId: 'a', quantity: 11 }] }, 'items.0.quantity'],
  ])('rejects %s', (_name, input, path) => {
    const result = orderInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues.map((i) => i.path.join('.'))).toContain(path);
  });
});

describe('response schemas', () => {
  const product = { id: 'p', name: 'P', description: 'd', category: 'home', priceCents: 100, rating: 4.5, stock: 1, emoji: '📦', hue: 10 };

  it('productSchema validates shape and ranges', () => {
    expect(productSchema.safeParse(product).success).toBe(true);
    expect(productSchema.safeParse({ ...product, rating: 6 }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, priceCents: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, priceCents: 1.5 }).success).toBe(false);
  });

  it('productPageSchema validates a page', () => {
    expect(productPageSchema.safeParse({ items: [product], total: 1, page: 1, pageSize: 8 }).success).toBe(true);
    expect(productPageSchema.safeParse({ items: [{}], total: 1, page: 1, pageSize: 8 }).success).toBe(false);
  });
});

describe('formatPrice', () => {
  it('formats cents as USD', () => {
    expect(formatPrice(12900)).toBe('$129.00');
    expect(formatPrice(5)).toBe('$0.05');
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('error contract', () => {
  it('parses API errors with and without a code', () => {
    expect(apiErrorSchema.parse({ error: 'x', code: 'NOT_FOUND' }).code).toBe('NOT_FOUND');
    expect(apiErrorSchema.parse({ error: 'bad gateway' }).code).toBeUndefined();
    expect(apiErrorSchema.safeParse({ error: 'x', code: 'MADE_UP' }).success).toBe(false);
  });

  it('classifies business vs server codes', () => {
    expect(['VALIDATION_ERROR', 'NOT_FOUND', 'OUT_OF_STOCK', 'CONFLICT', 'BAD_REQUEST'].every(isBusinessErrorCode)).toBe(true);
    expect(['INTERNAL_ERROR', 'DATABASE_ERROR', undefined, 'nope'].some(isBusinessErrorCode)).toBe(false);
  });
});
