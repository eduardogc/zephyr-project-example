import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@shop/types';
import { cart } from '../../store/cartStore';
import CartPage from './CartPage';

const product = (id: string, over: Partial<Product> = {}): Product => ({
  id, name: `Product ${id}`, description: 'd', category: 'home', priceCents: 1000, rating: 4, stock: 5, emoji: '📦', hue: 10, ...over,
});
const renderCart = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
const total = () => screen.getByText(/^Total:/);

beforeEach(() => act(() => cart.clear()));
afterEach(() => vi.unstubAllGlobals());

describe('CartPage: empty', () => {
  it('shows an empty state with a way back', () => {
    renderCart();
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });
});

describe('CartPage: lines', () => {
  it('lists each line with its name linking to the product, unit and line prices', () => {
    cart.add(product('a', { priceCents: 1500 }), 2);
    renderCart();
    expect(screen.getByRole('link', { name: 'Product a' })).toHaveAttribute('href', '/products/a');
    expect(screen.getByText('$15.00')).toBeInTheDocument(); // unit
    expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0); // line total
  });

  it('keeps the total in sync as quantities change and lines are removed', async () => {
    cart.add(product('a', { priceCents: 1500 }), 2);
    cart.add(product('b', { priceCents: 500 }), 1);
    renderCart();
    expect(total()).toHaveTextContent('Total: $35.00'); // 2×15 + 5

    const group = screen.getByRole('group', { name: 'Quantity of Product a' });
    await userEvent.click(within(group).getByRole('button', { name: 'Increase quantity' }));
    await waitFor(() => expect(total()).toHaveTextContent('Total: $50.00'));
    await userEvent.click(within(group).getByRole('button', { name: 'Decrease quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Product b' }));
    expect(screen.queryByText('Product b')).not.toBeInTheDocument();
    expect(total()).toHaveTextContent('Total: $30.00');
  });

  it('removes a line when its quantity is decreased to zero', async () => {
    cart.add(product('a'), 1);
    renderCart();
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('caps the quantity at the available stock', () => {
    cart.add(product('a', { stock: 2 }), 5);
    renderCart();
    expect(within(screen.getByRole('group', { name: 'Quantity of Product a' })).getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });
});

describe('CartPage: checkout', () => {
  it('shows the checkout form next to the lines', () => {
    cart.add(product('a'), 1);
    renderCart();
    expect(screen.getByRole('form', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('after a successful order shows a confirmation (order id, amount) and an empty cart', async () => {
    cart.add(product('a', { priceCents: 2000 }), 1);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'ord_abc12345', totalCents: 2000, createdAt: 'x' }), { status: 201, headers: { 'content-type': 'application/json' } })));
    renderCart();
    await userEvent.type(screen.getByLabelText(/Full name/), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText(/Email/), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/Shipping address/), '1 Analytical Street');
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));

    expect(await screen.findByRole('heading', { name: 'Thanks for your order!' })).toBeInTheDocument();
    expect(screen.getByText('ord_abc12345')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/');
    expect(cart.getSnapshot()).toHaveLength(0);
  });
});
