import { DatabaseSync } from 'node:sqlite';
import { productSchema, type Product, type ProductQuery } from '@shop/types';
import { SEED_PRODUCTS } from './seed.js';

export type Db = ReturnType<typeof createDb>;

/** Thin data layer over Node's built-in SQLite (no native deps). Pass ':memory:' for tests. */
export function createDb(file = ':memory:') {
  const sql = new DatabaseSync(file);
  sql.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL,
      price_cents INTEGER NOT NULL, rating REAL NOT NULL, stock INTEGER NOT NULL,
      emoji TEXT NOT NULL, hue INTEGER NOT NULL, position INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
      customer_address TEXT NOT NULL, total_cents INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL
    );
  `);

  const count = sql.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number };
  if (count.n === 0) {
    const insert = sql.prepare(
      'INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    SEED_PRODUCTS.forEach((p, i) =>
      insert.run(p.id, p.name, p.description, p.category, p.priceCents, p.rating, p.stock, p.emoji, p.hue, i),
    );
  }

  const toProduct = (row: Record<string, unknown>): Product =>
    productSchema.parse({
      id: row.id, name: row.name, description: row.description, category: row.category,
      priceCents: row.price_cents, rating: row.rating, stock: row.stock, emoji: row.emoji, hue: row.hue,
    });

  const ORDER_BY = {
    featured: 'position ASC',
    'price-asc': 'price_cents ASC',
    'price-desc': 'price_cents DESC',
    rating: 'rating DESC',
  } as const;

  return {
    listProducts(q: ProductQuery) {
      const where: string[] = [];
      const params: (string | number)[] = [];
      if (q.search) {
        where.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${q.search}%`, `%${q.search}%`);
      }
      if (q.category) {
        where.push('category = ?');
        params.push(q.category);
      }
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const { n } = sql.prepare(`SELECT COUNT(*) AS n FROM products ${clause}`).get(...params) as { n: number };
      const rows = sql
        .prepare(`SELECT * FROM products ${clause} ORDER BY ${ORDER_BY[q.sort]}, position ASC LIMIT ? OFFSET ?`)
        .all(...params, q.pageSize, (q.page - 1) * q.pageSize) as Record<string, unknown>[];
      return { items: rows.map(toProduct), total: n, page: q.page, pageSize: q.pageSize };
    },

    getProduct(id: string): Product | undefined {
      const row = sql.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
      return row && toProduct(row);
    },

    /** Transactional: validates stock, decrements it and records the order, or throws and rolls back. */
    createOrder(
      customer: { name: string; email: string; address: string },
      items: { productId: string; quantity: number }[],
    ) {
      sql.exec('BEGIN');
      try {
        let total = 0;
        const lines = items.map((item) => {
          const p = this.getProduct(item.productId);
          if (!p) throw new OrderError(`Unknown product: ${item.productId}`, 404);
          if (p.stock < item.quantity) throw new OrderError(`Not enough stock for ${p.name}`, 409);
          total += p.priceCents * item.quantity;
          return { p, quantity: item.quantity };
        });
        const id = `ord_${crypto.randomUUID().slice(0, 8)}`;
        const createdAt = new Date().toISOString();
        sql.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)').run(id, customer.name, customer.email, customer.address, total, createdAt);
        for (const { p, quantity } of lines) {
          sql.prepare('INSERT INTO order_items VALUES (?, ?, ?, ?)').run(id, p.id, quantity, p.priceCents);
          sql.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, p.id);
        }
        sql.exec('COMMIT');
        return { id, totalCents: total, createdAt };
      } catch (e) {
        sql.exec('ROLLBACK');
        throw e;
      }
    },

    close: () => sql.close(),
  };
}

export class OrderError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}
