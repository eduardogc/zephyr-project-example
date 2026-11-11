import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { withZephyr } from 'zephyr-rsbuild-plugin';

const singleton = { singleton: true } as const;

export default defineConfig({
  html: { title: 'Shop · product' },
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
      name: 'product',
      filename: 'remoteEntry.js',
      exposes: { './ProductPage': './src/ProductPage.tsx' },
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
    port: 3002,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
