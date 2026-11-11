import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerErrorHandler } from '../../plugins/error-handler';
import { healthRoutes } from './health.routes';

let app: ReturnType<typeof Fastify>;
const setup = (ping: () => Promise<void>) => {
  app = Fastify();
  registerErrorHandler(app);
  app.register(healthRoutes(ping));
  return app;
};
afterEach(() => app.close());

describe('GET /health', () => {
  it('is ok when the database answers', async () => {
    const ping = vi.fn().mockResolvedValue(undefined);
    const res = await setup(ping).inject('/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', database: 'up' });
    expect(ping).toHaveBeenCalledOnce();
  });

  it('fails with a typed DATABASE_ERROR (and no internals) when the database does not answer', async () => {
    const res = await setup(vi.fn().mockRejectedValue(new Error('SQLITE_CANTOPEN /secret/path'))).inject('/health');
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'Internal server error', code: 'DATABASE_ERROR' });
  });
});
