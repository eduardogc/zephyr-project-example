import { beforeEach, describe, expect, it } from 'vitest';
import { CART_ADD_EVENT, type Product } from '@shop/types';
import { cart } from './cartStore';

const product: Product = {
  id: 'p1', name: 'Thing', description: '', category: 'home', priceCents: 1000, rating: 4, stock: 3, emoji: '📦', hue: 10,
};

describe('cartStore', () => {
  beforeEach(() => cart.clear());

  it('adds via the cross-MFE window event and caps at stock', () => {
    window.dispatchEvent(new CustomEvent(CART_ADD_EVENT, { detail: { product, quantity: 2 } }));
    window.dispatchEvent(new CustomEvent(CART_ADD_EVENT, { detail: { product, quantity: 5 } }));
    expect(cart.getSnapshot()).toEqual([{ product, quantity: 3 }]);
  });

  it('removes a line when quantity reaches zero', () => {
    cart.add(product, 1);
    cart.setQuantity('p1', 0);
    expect(cart.getSnapshot()).toHaveLength(0);
  });

  it('notifies subscribers and persists', () => {
    let calls = 0;
    const off = cart.subscribe(() => calls++);
    cart.add(product, 1);
    off();
    expect(calls).toBe(1);
    expect(JSON.parse(localStorage.getItem('shop:cart:v1')!)).toHaveLength(1);
  });
});
