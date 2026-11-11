import type { FastifyInstance } from 'fastify';
import { normalizeError, toApiError, NotFoundError } from '../errors';

/** One place that turns every thrown value into a typed, consistent JSON error response. */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((thrown, req, reply) => {
    const error = normalizeError(thrown);
    const { statusCode, body } = toApiError(error);

    if (error.kind === 'server') {
      req.log.error({ err: error, cause: error.cause, code: error.code }, 'request failed');
    } else {
      req.log.info({ code: error.code, statusCode }, error.message);
    }
    return reply.status(statusCode).send(body);
  });

  app.setNotFoundHandler((req, reply) => {
    const { statusCode, body } = toApiError(new NotFoundError(`Route ${req.method} ${req.url.split('?')[0]} not found`));
    return reply.status(statusCode).send(body);
  });
}
