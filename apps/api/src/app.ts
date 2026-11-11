import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { Container } from './container';
import { healthRoutes } from './modules/health/health.routes';
import { ordersRoutes } from './modules/orders/orders.routes';
import { productsRoutes } from './modules/products/products.routes';
import { registerErrorHandler } from './plugins/error-handler';

export function buildApp(container: Container, options: { logLevel?: string } = {}) {
  const app = Fastify({ logger: options.logLevel === 'silent' ? false : { level: options.logLevel ?? 'info' } });

  app.register(cors, { origin: true });
  registerErrorHandler(app);

  app.register(healthRoutes(container.ping));
  app.register(productsRoutes(container.productsService), { prefix: '/api' });
  app.register(ordersRoutes(container.ordersService), { prefix: '/api' });

  return app;
}
