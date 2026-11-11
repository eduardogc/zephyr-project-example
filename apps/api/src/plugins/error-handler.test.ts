import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BadRequestError, ConflictError, DatabaseError, NotFoundError, OutOfStockError, ServerError, ValidationError } from '../errors';
import { registerErrorHandler } from './error-handler';

type Log = Record<string, unknown>;
const logs: Log[] = [];
const stream = { write: (line: string) => void logs.push(JSON.parse(line)) };

function setup() {
  logs.length = 0;
  const app = Fastify({ logger: { level: 'info', stream } });
  registerErrorHandler(app);
  const throwing = (thrown: unknown) => () => { throw thrown; };
  app.get('/not-found', throwing(new NotFoundError('Thing not found')));
  app.get('/conflict', throwing(new ConflictError('Already exists')));
  app.get('/bad-request', throwing(new BadRequestError('Nope')));
  app.get('/stock', throwing(new OutOfStockError('p', 'Thing')));
  app.get('/validation', throwing(new ValidationError([{ path: 'a', message: 'bad' }])));
  app.get('/zod', () => z.object({ n: z.number() }).parse({ n: 'x' }));
  app.get('/db', throwing(new DatabaseError('orders.create', { cause: new Error('UNIQUE constraint failed') })));
  app.get('/server', throwing(new ServerError('explicit')));
  app.get('/unknown', throwing(new TypeError('x is not a function')));
  app.get('/string', throwing('just a string'));
  app.get('/async', async () => { throw new Error('async boom'); });
  app.post('/json', async (req) => req.body);
  return app;
}
let app: ReturnType<typeof setup>;
afterEach(() => app.close());

describe('business errors: exposed to the client, logged quietly', () => {
  it.each([
    ['/not-found', 404, { error: 'Thing not found', code: 'NOT_FOUND' }],
    ['/conflict', 409, { error: 'Already exists', code: 'CONFLICT' }],
    ['/bad-request', 400, { error: 'Nope', code: 'BAD_REQUEST' }],
    ['/stock', 409, { error: 'Not enough stock for Thing', code: 'OUT_OF_STOCK' }],
    ['/validation', 400, { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: [{ path: 'a', message: 'bad' }] }],
  ])('%s -> %i', async (url, status, body) => {
    app = setup();
    const res = await app.inject(url);
    expect(res.statusCode).toBe(status);
    expect(res.json()).toEqual(body);
    expect(logs.some((l) => l.level === 50)).toBe(false); // nothing at "error" level for a user mistake
  });

  it('converts a raw ZodError thrown by a route into a ValidationError response', async () => {
    app = setup();
    const res = await app.inject('/zod');
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: 'n' }] });
  });
});

describe('server errors: generic to the client, detailed in the logs', () => {
  it.each([
    ['/db', 'DATABASE_ERROR'],
    ['/server', 'INTERNAL_ERROR'],
    ['/unknown', 'INTERNAL_ERROR'],
    ['/string', 'INTERNAL_ERROR'],
    ['/async', 'INTERNAL_ERROR'],
  ])('%s -> 500 %s without leaking details', async (url, code) => {
    app = setup();
    const res = await app.inject(url);
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'Internal server error', code });
    expect(res.body).not.toMatch(/UNIQUE|TypeError|boom|explicit|orders\.create/);
  });

  it('logs the failure at error level, including the original cause', async () => {
    app = setup();
    await app.inject('/db');
    const entry = logs.find((l) => l.level === 50);
    expect(entry).toBeDefined();
    expect(JSON.stringify(entry)).toMatch(/UNIQUE constraint failed/);
    expect(entry).toMatchObject({ code: 'DATABASE_ERROR', msg: 'request failed' });
  });
});

describe('framework errors and unknown routes', () => {
  it('unknown route -> JSON 404 in our format (not Fastify’s default)', async () => {
    app = setup();
    const res = await app.inject('/nowhere?x=1');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Route GET /nowhere not found', code: 'NOT_FOUND' });
  });

  it('malformed JSON body -> 400 BAD_REQUEST', async () => {
    app = setup();
    const res = await app.inject({ method: 'POST', url: '/json', headers: { 'content-type': 'application/json' }, payload: '{oops' });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('BAD_REQUEST');
  });
});
