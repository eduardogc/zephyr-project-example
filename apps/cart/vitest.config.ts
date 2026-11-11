import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { env: { PUBLIC_API_URL: '/api' }, environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] } });
