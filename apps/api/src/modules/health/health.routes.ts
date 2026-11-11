import type { FastifyPluginAsync } from 'fastify';
import { guardDb } from '../../errors';

/** Liveness + readiness in one: also proves the database answers (Render restarts on failure). */
export const healthRoutes =
  (ping: () => Promise<void>): FastifyPluginAsync =>
  async (app) => {
    app.get('/health', async () => {
      await guardDb('health.ping', ping);
      return { status: 'ok', database: 'up' };
    });
  };

