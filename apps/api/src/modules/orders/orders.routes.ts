import type { FastifyPluginAsync } from 'fastify';
import { orderInputSchema } from '@shop/types';
import type { OrdersService } from './orders.service';

export const ordersRoutes =
  (service: OrdersService): FastifyPluginAsync =>
  async (app) => {
    app.post('/orders', async (req, reply) => reply.status(201).send(await service.create(orderInputSchema.parse(req.body))));
  };
