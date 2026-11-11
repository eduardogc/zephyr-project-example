import { useSyncExternalStore } from 'react';
import { CART_ADD_EVENT, type CartAddDetail, type Product } from '@shop/types';

export type CartLine = { product: Product; quantity: number };
const KEY = 'shop:cart:v1';
const MAX_QTY = 10;

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

let lines: CartLine[] = load();
const listeners = new Set<() => void>();

function commit(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in-memory only */
  }
  listeners.forEach((l) => l());
}

export const cart = {
  add(product: Product, quantity: number) {
    const existing = lines.find((l) => l.product.id === product.id);
    const qty = Math.min(MAX_QTY, product.stock, (existing?.quantity ?? 0) + quantity);
    commit(
      existing
        ? lines.map((l) => (l.product.id === product.id ? { product, quantity: qty } : l))
        : [...lines, { product, quantity: qty }],
    );
  },
  setQuantity(id: string, quantity: number) {
    commit(
      quantity <= 0
        ? lines.filter((l) => l.product.id !== id)
        : lines.map((l) => (l.product.id === id ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
    );
  },
  clear: () => commit([]),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => lines,
};

// Other micro-frontends (e.g. product) announce "add to cart" on `window`; the cart owns the state.
window.addEventListener(CART_ADD_EVENT, (e) => {
  const { product, quantity } = (e as CustomEvent<CartAddDetail>).detail;
  cart.add(product, quantity);
});

export const useCart = () => {
  const items = useSyncExternalStore(cart.subscribe, cart.getSnapshot);
  return {
    items,
    count: items.reduce((n, l) => n + l.quantity, 0),
    totalCents: items.reduce((n, l) => n + l.quantity * l.product.priceCents, 0),
  };
};
