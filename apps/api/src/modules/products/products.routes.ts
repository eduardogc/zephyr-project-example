import type { FastifyPluginAsync } from 'fastify';
import { CATEGORIES, productQuerySchema } from '@shop/types';
import type { ProductsService } from './products.service';

export const productsRoutes =
  (service: ProductsService): FastifyPluginAsync =>
  async (app) => {
    app.get('/categories', async () => CATEGORIES);
    app.get('/products', async (req) => service.list(productQuerySchema.parse(req.query)));
    app.get<{ Params: { id: string } }>('/products/:id', async (req) => service.getById(req.params.id));
  };
