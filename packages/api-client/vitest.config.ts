import { defineConfig } from 'vitest/config';

// Tests must not depend on the shell environment (CI sets PUBLIC_API_URL for production builds).
export default defineConfig({ test: { env: { PUBLIC_API_URL: '/api' } } });
