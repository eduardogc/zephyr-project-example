import { z } from 'zod';

export const CATEGORIES = ['audio', 'wearables', 'home', 'accessories'] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: categorySchema,
  priceCents: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  stock: z.number().int().nonnegative(),
  emoji: z.string(),
  hue: z.number().min(0).max(360),
});
export type Product = z.infer<typeof productSchema>;

export const SORTS = ['featured', 'price-asc', 'price-desc', 'rating'] as const;

export const productQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  category: categorySchema.optional(),
  sort: z.enum(SORTS).default('featured'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const productPageSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type ProductPage = z.infer<typeof productPageSchema>;

export const orderInputSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Name is too short'),
    email: z.string().trim().email('Invalid email'),
    address: z.string().trim().min(5, 'Address is too short'),
  }),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(10) }))
    .min(1, 'Cart is empty'),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const orderSchema = z.object({
  id: z.string(),
  totalCents: z.number().int(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Cross-micro-frontend contract: remotes talk through window events, not imports. */
export const CART_ADD_EVENT = 'shop:cart:add';
export type CartAddDetail = { product: Product; quantity: number };

export const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
