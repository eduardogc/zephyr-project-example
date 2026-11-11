import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('has sensible defaults', () => {
    expect(loadConfig({})).toEqual({ env: 'development', port: 4000, dbFile: 'data/shop.sqlite', logLevel: 'info' });
  });

  it('reads and coerces values', () => {
    expect(loadConfig({ PORT: '8080', DB_FILE: '/tmp/x.sqlite', NODE_ENV: 'production', LOG_LEVEL: 'warn' })).toEqual({
      env: 'production', port: 8080, dbFile: '/tmp/x.sqlite', logLevel: 'warn',
    });
  });

  it('is silent by default in tests', () => {
    expect(loadConfig({ NODE_ENV: 'test' }).logLevel).toBe('silent');
  });

  it.each([{ PORT: 'abc' }, { PORT: '0' }, { PORT: '70000' }, { NODE_ENV: 'staging' }, { DB_FILE: '' }, { LOG_LEVEL: 'loud' }])('rejects %o with a readable message', (env) => {
    expect(() => loadConfig(env)).toThrow(/Invalid environment: /);
  });
});
