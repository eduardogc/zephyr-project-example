import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AppError, BadRequestError, BusinessError, ConflictError, DatabaseError, NotFoundError, OutOfStockError, PUBLIC_SERVER_MESSAGE,
  ServerError, ValidationError, guardDb, normalizeError, toApiError,
} from './index';

describe('error classes', () => {
  it.each([
    [new BadRequestError('bad'), 'business', 'BAD_REQUEST', 400],
    [new ValidationError([{ path: 'a', message: 'm' }]), 'business', 'VALIDATION_ERROR', 400],
    [new NotFoundError('nope'), 'business', 'NOT_FOUND', 404],
    [new ConflictError('dup'), 'business', 'CONFLICT', 409],
    [new OutOfStockError('p1', 'Aero Buds'), 'business', 'OUT_OF_STOCK', 409],
    [new ServerError('boom'), 'server', 'INTERNAL_ERROR', 500],
    [new DatabaseError('products.list'), 'server', 'DATABASE_ERROR', 500],
  ] as const)('%o has the right kind, code and status', (err, kind, code, status) => {
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect({ kind: err.kind, code: err.code, statusCode: err.statusCode }).toEqual({ kind, code, statusCode: status });
  });

  it('keeps the concrete class name and the original cause', () => {
    const cause = new Error('sqlite is angry');
    const err = new DatabaseError('orders.create', { cause });
    expect(err.name).toBe('DatabaseError');
    expect(err.cause).toBe(cause);
    expect(err.operation).toBe('orders.create');
    expect(err.message).toContain('orders.create');
  });

  it('OutOfStockError exposes the product and a readable message', () => {
    const err = new OutOfStockError('aero-buds', 'Aero Buds Pro');
    expect(err).toBeInstanceOf(BusinessError);
    expect(err.productId).toBe('aero-buds');
    expect(err.message).toBe('Not enough stock for Aero Buds Pro');
  });
});

describe('normalizeError', () => {
  it('passes our own errors through untouched', () => {
    const err = new NotFoundError();
    expect(normalizeError(err)).toBe(err);
  });

  it('turns a ZodError into a ValidationError with dotted paths', () => {
    const result = z.object({ a: z.object({ b: z.string() }) }).safeParse({ a: {} });
    const err = normalizeError(!result.success && result.error);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).issues).toEqual([{ path: 'a.b', message: expect.any(String) }]);
  });

  it('maps framework 4xx errors to business errors', () => {
    expect(normalizeError(Object.assign(new Error('Body is not valid JSON'), { statusCode: 400 }))).toBeInstanceOf(BadRequestError);
    expect(normalizeError(Object.assign(new Error('Route not found'), { statusCode: 404 }))).toBeInstanceOf(NotFoundError);
    expect(normalizeError(Object.assign(new Error('Payload too large'), { statusCode: 413 })).code).toBe('BAD_REQUEST');
  });

  it.each([new Error('kaboom'), 'a string', null, undefined, { statusCode: 500 }])('wraps unknown value %o as a ServerError with the cause', (thrown) => {
    const err = normalizeError(thrown);
    expect(err).toBeInstanceOf(ServerError);
    expect(err.cause).toBe(thrown);
  });
});

describe('toApiError', () => {
  it('exposes business errors: message, code and validation issues', () => {
    expect(toApiError(new OutOfStockError('p', 'Thing'))).toEqual({ statusCode: 409, body: { error: 'Not enough stock for Thing', code: 'OUT_OF_STOCK' } });
    const issues = [{ path: 'customer.email', message: 'Invalid email' }];
    expect(toApiError(new ValidationError(issues))).toEqual({ statusCode: 400, body: { error: 'Validation failed', code: 'VALIDATION_ERROR', issues } });
  });

  it('never leaks server error details', () => {
    const secret = new DatabaseError('orders.create', { cause: new Error('UNIQUE constraint failed: orders.id /var/db/secret.sqlite') });
    const { statusCode, body } = toApiError(secret);
    expect(statusCode).toBe(500);
    expect(body).toEqual({ error: PUBLIC_SERVER_MESSAGE, code: 'DATABASE_ERROR' });
    expect(JSON.stringify(body)).not.toMatch(/secret|UNIQUE|orders\.create/);
  });
});

describe('guardDb', () => {
  it('returns the value on success', async () => {
    await expect(guardDb('op', async () => 42)).resolves.toBe(42);
  });

  it('wraps unexpected failures in a DatabaseError that keeps the cause', async () => {
    const cause = new Error('SQLITE_BUSY');
    const err = await guardDb('products.list', async () => { throw cause; }).catch((e) => e);
    expect(err).toBeInstanceOf(DatabaseError);
    expect(err).toMatchObject({ operation: 'products.list', cause });
  });

  it('lets typed errors through without wrapping', async () => {
    const notFound = new NotFoundError();
    await expect(guardDb('op', async () => { throw notFound; })).rejects.toBe(notFound);
  });
});
