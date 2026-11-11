// Runs against the REAL api-client with `fetch` stubbed, so request building and error mapping are covered too.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@shop/types';
import CartButton from './CartButton';
import CartPage from './CartPage';
import { cart } from './cartStore';

const product = (id: string, over: Partial<Product> = {}): Product => ({
  id, name: `Product ${id}`, description: 'd', category: 'home', priceCents: 1000, rating: 4, stock: 5, emoji: '📦', hue: 10, ...over,
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const renderCart = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <MemoryRouter>
        <CartButton />
        <CartPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const fill = async (name = 'Ada Lovelace', email = 'ada@example.com', address = '1 Analytical Street') => {
  await userEvent.type(screen.getByLabelText(/Full name/), name);
  await userEvent.type(screen.getByLabelText(/Email/), email);
  await userEvent.type(screen.getByLabelText(/Shipping address/), address);
};

beforeEach(() => cart.clear());
afterEach(() => vi.unstubAllGlobals());

describe('CartButton', () => {
  it('shows the item count in its accessible name', () => {
    renderCart();
    expect(screen.getByRole('link', { name: 'Cart, 0 items' })).toBeInTheDocument();
    cart.add(product('a'), 2);
    cart.add(product('b'), 1);
    // useSyncExternalStore re-renders on the next tick
    return waitFor(() => expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toBeInTheDocument());
  });
});

describe('CartPage', () => {
  it('shows an empty state with a way back', () => {
    renderCart();
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/');
  });

  it('lists lines with totals and lets you change quantity and remove items', async () => {
    cart.add(product('a', { priceCents: 1500 }), 2);
    cart.add(product('b', { priceCents: 500 }), 1);
    renderCart();
    expect(screen.getByText(/^Total:/)).toHaveTextContent('Total: $35.00'); // 2×15 + 5

    const group = screen.getByRole('group', { name: 'Quantity of Product a' });
    await userEvent.click(within(group).getByRole('button', { name: 'Increase quantity' }));
    await waitFor(() => expect(screen.getByText(/^Total:/)).toHaveTextContent('Total: $50.00'));
    await userEvent.click(within(group).getByRole('button', { name: 'Decrease quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Product b' }));
    expect(screen.queryByText('Product b')).not.toBeInTheDocument();
    expect(screen.getByText(/^Total:/)).toHaveTextContent('Total: $30.00');
  });

  it('caps the quantity at the available stock', () => {
    cart.add(product('a', { stock: 2 }), 5);
    renderCart();
    const group = screen.getByRole('group', { name: 'Quantity of Product a' });
    expect(within(group).getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });
});

describe('Checkout', () => {
  beforeEach(() => cart.add(product('a'), 2));

  it('validates on the client, flags every bad field and focuses the first one', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderCart();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));

    const name = screen.getByLabelText(/Full name/);
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription('Name is too short');
    expect(screen.getByLabelText(/Email/)).toHaveAccessibleDescription('Invalid email');
    expect(screen.getByLabelText(/Shipping address/)).toHaveAccessibleDescription('Address is too short');
    await waitFor(() => expect(name).toHaveFocus());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('places the order, sends the right payload, clears the cart and confirms', async () => {
    const fetchMock = vi.fn(async () => json({ id: 'ord_abc12345', totalCents: 2000, createdAt: '2026-01-01T00:00:00Z' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    renderCart();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));

    expect(await screen.findByRole('heading', { name: 'Thanks for your order!' })).toBeInTheDocument();
    expect(screen.getByText('ord_abc12345')).toBeInTheDocument();
    expect(cart.getSnapshot()).toHaveLength(0);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/orders');
    expect(JSON.parse(init.body as string)).toEqual({
      customer: { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical Street' },
      items: [{ productId: 'a', quantity: 2 }],
    });
  });

  it('maps server-side validation issues back onto the fields', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Validation failed', issues: [{ path: 'customer.email', message: 'Email already blocked' }] }, 400)));
    renderCart();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    expect(await screen.findByText('Email already blocked')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInvalid();
    expect(cart.getSnapshot()).toHaveLength(1); // cart kept so the user can retry
  });

  it('shows a stock conflict as an alert and keeps the cart', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Not enough stock for Product a' }, 409)));
    renderCart();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Not enough stock for Product a');
    expect(cart.getSnapshot()).toHaveLength(1);
  });

  it('disables the button while the order is being placed', async () => {
    let release: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (release = r))));
    renderCart();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    expect(await screen.findByRole('button', { name: 'Placing order…' })).toBeDisabled();
    release(json({ id: 'ord_1', totalCents: 1, createdAt: 'x' }, 201));
    expect(await screen.findByRole('heading', { name: 'Thanks for your order!' })).toBeInTheDocument();
  });
});
