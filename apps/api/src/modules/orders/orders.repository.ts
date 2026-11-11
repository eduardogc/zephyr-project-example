import type { Executor } from '../../db/client';
import { orderItems, orders, type NewOrderItemRow, type NewOrderRow } from '../../db/schema';
import { guardDb } from '../../errors';

export class OrdersRepository {
  constructor(private readonly db: Executor) {}

  create(order: NewOrderRow, items: Omit<NewOrderItemRow, 'orderId'>[]): Promise<void> {
    return guardDb('orders.create', async () => {
      await this.db.insert(orders).values(order);
      await this.db.insert(orderItems).values(items.map((item) => ({ ...item, orderId: order.id })));
    });
  }
}
