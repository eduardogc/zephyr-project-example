import cors from '@fastify/cors';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import { CATEGORIES, orderInputSchema, productQuerySchema } from '@shop/types';
import { OrderError, type Db } from './db.js';

export function buildApp(db: Db) {
  const app = Fastify({ logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' } });
  app.register(cors, { origin: true });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation failed',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    if (err instanceof OrderError) return reply.status(err.statusCode).send({ error: err.message });
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    return reply.status(status).send({ error: status >= 500 ? 'Internal server error' : (err as Error).message });
  });

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/api/categories', async () => CATEGORIES);

  app.get('/api/products', async (req) => db.listProducts(productQuerySchema.parse(req.query)));

  app.get<{ Params: { id: string } }>('/api/products/:id', async (req, reply) => {
    const product = db.getProduct(req.params.id);
    return product ?? reply.status(404).send({ error: 'Product not found' });
  });

  app.post('/api/orders', async (req, reply) => {
    const input = orderInputSchema.parse(req.body);
    return reply.status(201).send(db.createOrder(input.customer, input.items));
  });

  return app;
}
