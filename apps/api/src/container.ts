import type { Database } from './db/client';
import { OrdersRepository } from './modules/orders/orders.repository';
import { OrdersService, type UnitOfWork } from './modules/orders/orders.service';
import { ProductsRepository } from './modules/products/products.repository';
import { ProductsService } from './modules/products/products.service';

/** The only place that knows how the layers are assembled (repositories -> services). */
export function createContainer(database: Database) {
  const unitOfWork: UnitOfWork = (work) =>
    database.transaction((tx) => work({ products: new ProductsRepository(tx), orders: new OrdersRepository(tx) }));

  return {
    productsService: new ProductsService(new ProductsRepository(database.db)),
    ordersService: new OrdersService({ unitOfWork }),
    ping: database.ping,
  };
}
export type Container = ReturnType<typeof createContainer>;
