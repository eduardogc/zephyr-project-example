import { check, index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { CATEGORIES } from '@shop/types';

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category', { enum: CATEGORIES }).notNull(),
    priceCents: integer('price_cents').notNull(),
    rating: real('rating').notNull(),
    stock: integer('stock').notNull(),
    emoji: text('emoji').notNull(),
    hue: integer('hue').notNull(),
    /** Display order for the "featured" sort. */
    position: integer('position').notNull(),
  },
  (t) => [
    index('products_category_idx').on(t.category),
    check('products_stock_non_negative', sql`${t.stock} >= 0`),
    check('products_price_non_negative', sql`${t.priceCents} >= 0`),
  ],
);

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerAddress: text('customer_address').notNull(),
  totalCents: integer('total_cents').notNull(),
  createdAt: text('created_at').notNull(),
});

export const orderItems = sqliteTable(
  'order_items',
  {
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.productId] }), check('order_items_quantity_positive', sql`${t.quantity} > 0`)],
);

export type ProductRow = typeof products.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
