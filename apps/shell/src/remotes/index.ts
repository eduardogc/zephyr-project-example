import { lazy } from 'react';

// Each import below is a separately deployed micro-frontend (see rsbuild.config.ts / Zephyr).
// Types for these module names live in ./remotes.d.ts.
export const CatalogPage = lazy(() => import('catalog/CatalogPage'));
export const ProductPage = lazy(() => import('product/ProductPage'));
export const CartPage = lazy(() => import('cart/CartPage'));
export const CartButton = lazy(() => import('cart/CartButton'));
