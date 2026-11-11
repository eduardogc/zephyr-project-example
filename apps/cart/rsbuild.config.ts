import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { withZephyr } from 'zephyr-rsbuild-plugin';

const singleton = { singleton: true } as const;

export default defineConfig({
  html: { title: 'Shop · cart' },
  output: { assetPrefix: 'auto' },
  source: {
    // Always inline the API base URL: an unset PUBLIC_* var is otherwise left as `process.env...` and
    // crashes in the browser (`process is not defined`). Default: same-origin `/api` (dev proxy).
    define: { 'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL ?? '/api') },
    // Workspace packages ship TypeScript source; let Rsbuild compile them.
    include: [path.resolve(__dirname, '../../packages')],
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'cart',
      filename: 'remoteEntry.js',
      exposes: { './CartButton': './src/CartButton.tsx', './CartPage': './src/CartPage.tsx' },
      shared: {
        react: singleton,
        'react-dom': singleton,
        'react-router': singleton,
        '@tanstack/react-query': singleton,
      },
    }),
    withZephyr(),
  ],
  server: {
    port: 3003,
    strictPort: true, // fail if the port is taken: the shell hard-codes these remote URLs
    proxy: { '/api': 'http://localhost:4000' },
  },
});
