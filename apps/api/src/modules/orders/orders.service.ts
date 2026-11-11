import { randomUUID } from 'node:crypto';
import { type Order, type OrderInput } from '@shop/types';
import { NotFoundError, OutOfStockError, ValidationError } from '../../errors';
import type { ProductsRepository } from '../products/products.repository';
import type { OrdersRepository } from './orders.repository';

export const MAX_QUANTITY_PER_PRODUCT = 10;

export type OrderRepos = {
  products: Pick<ProductsRepository, 'findManyByIds' | 'decrementStock'>;
  orders: Pick<OrdersRepository, 'create'>;
};
/** Runs `work` in one transaction with repositories bound to it. Provided by the container. */
export type UnitOfWork = <T>(work: (repos: OrderRepos) => Promise<T>) => Promise<T>;

type Deps = { unitOfWork: UnitOfWork; now?: () => Date; newId?: () => string };

/** Same product listed twice in the cart -> one line with the summed quantity. */
export function mergeLines(items: OrderInput['items']) {
  const merged = new Map<string, number>();
  for (const { productId, quantity } of items) merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

export class OrdersService {
  private readonly unitOfWork: UnitOfWork;
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor({ unitOfWork, now = () => new Date(), newId = () => `ord_${randomUUID().slice(0, 8)}` }: Deps) {
    this.unitOfWork = unitOfWork;
    this.now = now;
    this.newId = newId;
  }

  /**
   * Business rules: every product must exist, each product is capped at MAX_QUANTITY_PER_PRODUCT,
   * stock must cover the quantity (checked up front for a clear message AND enforced atomically by
   * the database), prices are taken from the catalogue (never from the client), all or nothing.
   */
  async create(input: OrderInput): Promise<Order> {
    const lines = mergeLines(input.items);
    const tooMany = lines.find((l) => l.quantity > MAX_QUANTITY_PER_PRODUCT);
    if (tooMany) {
      throw new ValidationError([{ path: 'items', message: `At most ${MAX_QUANTITY_PER_PRODUCT} units of the same product` }]);
    }

    return this.unitOfWork(async ({ products, orders }) => {
      const catalogue = new Map((await products.findManyByIds(lines.map((l) => l.productId))).map((p) => [p.id, p]));

      let totalCents = 0;
      const items = lines.map(({ productId, quantity }) => {
        const product = catalogue.get(productId);
        if (!product) throw new NotFoundError(`Unknown product: ${productId}`);
        if (product.stock < quantity) throw new OutOfStockError(product.id, product.name);
        totalCents += product.priceCents * quantity;
        return { productId, quantity, unitPriceCents: product.priceCents, name: product.name };
      });

      for (const item of items) {
        // Lost a race with another order since we read the stock above.
        if (!(await products.decrementStock(item.productId, item.quantity))) throw new OutOfStockError(item.productId, item.name);
      }

      const order = { id: this.newId(), totalCents, createdAt: this.now().toISOString() };
      await orders.create(
        { ...order, customerName: input.customer.name, customerEmail: input.customer.email, customerAddress: input.customer.address },
        items.map(({ productId, quantity, unitPriceCents }) => ({ productId, quantity, unitPriceCents })),
      );
      return order;
    });
  }
}
