import {
  apiErrorSchema,
  isBusinessErrorCode,
  type ErrorCode,
  orderSchema,
  productPageSchema,
  productSchema,
  type Order,
  type OrderInput,
  type Product,
  type ProductPage,
  type ProductQuery,
} from '@shop/types';

// Rsbuild inlines PUBLIC_* env vars. Defaults to same-origin `/api` (dev proxy / reverse proxy).
declare const process: { env: Record<string, string | undefined> };
const BASE = process.env.PUBLIC_API_URL ?? '/api';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues: { path: string; message: string }[] = [],
    public code?: ErrorCode,
  ) {
    super(message);
  }

  /** True when the server rejected the request on a business rule (message is safe to show users). */
  get isBusinessError() {
    return isBusinessErrorCode(this.code);
  }
}

async function request<T>(path: string, parse: (data: unknown) => T, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = apiErrorSchema.safeParse(data);
    throw new ApiRequestError(err.success ? err.data.error : res.statusText, res.status, err.success ? err.data.issues : [], err.success ? err.data.code : undefined);
  }
  return parse(data);
}

export const api = {
  listProducts(query: Partial<ProductQuery> = {}): Promise<ProductPage> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') params.set(k, String(v));
    return request(`/products?${params}`, (d) => productPageSchema.parse(d));
  },
  getProduct(id: string): Promise<Product> {
    return request(`/products/${encodeURIComponent(id)}`, (d) => productSchema.parse(d));
  },
  createOrder(input: OrderInput): Promise<Order> {
    return request('/orders', (d) => orderSchema.parse(d), { method: 'POST', body: JSON.stringify(input) });
  },
};
