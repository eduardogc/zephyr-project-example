import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { withZephyr } from 'zephyr-rsbuild-plugin';

const singleton = { singleton: true } as const;

export default defineConfig({
  html: { title: 'Shop · catalog' },
  output: { assetPrefix: 'auto' },
  source: {
    // Workspace packages ship TypeScript source; let Rsbuild compile them.
    include: [path.resolve(__dirname, '../../packages')],
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: { './CatalogPage': './src/CatalogPage.tsx' },
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
    port: 3001,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
