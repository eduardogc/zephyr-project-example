import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { productSchema, type Product, type ProductPage, type ProductQuery } from '@shop/types';
import type { Executor } from '../../db/client';
import { products, type ProductRow } from '../../db/schema';
import { guardDb } from '../../errors';

const ORDER_BY = {
  featured: [asc(products.position)],
  'price-asc': [asc(products.priceCents), asc(products.position)],
  'price-desc': [desc(products.priceCents), asc(products.position)],
  rating: [desc(products.rating), asc(products.position)],
} as const;

/** `%` and `_` are LIKE wildcards: escape them so searching for "50%" matches the text "50%". */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

const toProduct = (row: ProductRow): Product =>
  productSchema.parse({
    id: row.id, name: row.name, description: row.description, category: row.category,
    priceCents: row.priceCents, rating: row.rating, stock: row.stock, emoji: row.emoji, hue: row.hue,
  });

export class ProductsRepository {
  constructor(private readonly db: Executor) {}

  list(query: ProductQuery): Promise<ProductPage> {
    return guardDb('products.list', async () => {
      const filters: (SQL | undefined)[] = [];
      if (query.search) {
        const pattern = `%${escapeLike(query.search)}%`;
        filters.push(or(sql`${products.name} LIKE ${pattern} ESCAPE '\\'`, sql`${products.description} LIKE ${pattern} ESCAPE '\\'`));
      }
      if (query.category) filters.push(eq(products.category, query.category));
      const where = and(...filters);

      const [totalRow] = await this.db.select({ total: count() }).from(products).where(where);
      const rows = await this.db
        .select()
        .from(products)
        .where(where)
        .orderBy(...ORDER_BY[query.sort])
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);

      return { items: rows.map(toProduct), total: totalRow?.total ?? 0, page: query.page, pageSize: query.pageSize };
    });
  }

  findById(id: string): Promise<Product | undefined> {
    return guardDb('products.findById', async () => {
      const [row] = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
      return row && toProduct(row);
    });
  }

  findManyByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return guardDb('products.findManyByIds', async () => (await this.db.select().from(products).where(inArray(products.id, ids))).map(toProduct));
  }

  /**
   * Atomic "take N from stock": the WHERE guard makes the database itself refuse to go below zero,
   * so two concurrent orders can never both win the last unit. Returns false when stock was too low.
   */
  decrementStock(id: string, quantity: number): Promise<boolean> {
    return guardDb('products.decrementStock', async () => {
      const result = await this.db
        .update(products)
        .set({ stock: sql`${products.stock} - ${quantity}` })
        .where(and(eq(products.id, id), sql`${products.stock} >= ${quantity}`));
      return result.rowsAffected === 1;
    });
  }
}
