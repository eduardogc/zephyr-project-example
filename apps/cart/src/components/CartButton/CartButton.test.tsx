import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Product } from '@shop/types';
import { cart } from '../../store/cartStore';
import CartButton from './CartButton';

const product = (id: string): Product => ({ id, name: id, description: 'd', category: 'home', priceCents: 100, rating: 4, stock: 9, emoji: '📦', hue: 1 });
const renderButton = () => render(<MemoryRouter><CartButton /></MemoryRouter>);

beforeEach(() => act(() => cart.clear()));

describe('CartButton', () => {
  it('links to the cart page with the item count in its accessible name', () => {
    renderButton();
    const link = screen.getByRole('link', { name: 'Cart, 0 items' });
    expect(link).toHaveAttribute('href', '/cart');
  });

  it('shows a badge only when there are items, and counts units not lines', () => {
    renderButton();
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    act(() => {
      cart.add(product('a'), 2);
      cart.add(product('b'), 1);
    });
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('uses the singular for exactly one item', () => {
    renderButton();
    act(() => cart.add(product('a'), 1));
    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument();
  });
});
