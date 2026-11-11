// Real api-client with `fetch` stubbed: request building and error mapping are covered as well.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@shop/types';
import { cart, type CartLine } from '../../store/cartStore';
import { CheckoutForm } from './CheckoutForm';

const product: Product = { id: 'a', name: 'Product a', description: 'd', category: 'home', priceCents: 1000, rating: 4, stock: 5, emoji: '📦', hue: 1 };
const items: CartLine[] = [{ product, quantity: 2 }];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const renderForm = (onSuccess = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <CheckoutForm items={items} onSuccess={onSuccess} />
    </QueryClientProvider>,
  );
  return onSuccess;
};
const fill = async (name = 'Ada Lovelace', email = 'ada@example.com', address = '1 Analytical Street') => {
  await userEvent.type(screen.getByLabelText(/Full name/), name);
  await userEvent.type(screen.getByLabelText(/Email/), email);
  await userEvent.type(screen.getByLabelText(/Shipping address/), address);
};
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Place order' }));

beforeEach(() => cart.add(product, 2));
afterEach(() => {
  cart.clear();
  vi.unstubAllGlobals();
});

describe('CheckoutForm: structure', () => {
  it('is a labelled form whose fields are required and carry autocomplete hints', () => {
    renderForm();
    expect(screen.getByRole('form', { name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/Shipping address/)).toHaveAttribute('autocomplete', 'street-address');
    for (const field of screen.getAllByRole('textbox')) expect(field).toBeRequired();
  });
});

describe('CheckoutForm: client validation', () => {
  it('flags every bad field, links each message to its field, and focuses the first one', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderForm();
    await submit();

    const name = screen.getByLabelText(/Full name/);
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription('Name is too short');
    expect(screen.getByLabelText(/Email/)).toHaveAccessibleDescription('Invalid email');
    expect(screen.getByLabelText(/Shipping address/)).toHaveAccessibleDescription('Address is too short');
    await waitFor(() => expect(name).toHaveFocus());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the errors once the form is valid', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ id: 'ord_1', totalCents: 1, createdAt: 'x' }, 201)));
    renderForm();
    await submit();
    expect(screen.getByLabelText(/Email/)).toBeInvalid();
    await fill();
    await submit();
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toBeValid());
  });
});

describe('CheckoutForm: placing the order', () => {
  it('sends the right payload, empties the cart and reports the order', async () => {
    const order = { id: 'ord_abc12345', totalCents: 2000, createdAt: '2026-01-01T00:00:00Z' };
    const fetchMock = vi.fn(async () => json(order, 201));
    vi.stubGlobal('fetch', fetchMock);
    const onSuccess = renderForm();
    await fill();
    await submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(order));
    expect(cart.getSnapshot()).toHaveLength(0);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/orders');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      customer: { name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Analytical Street' },
      items: [{ productId: 'a', quantity: 2 }],
    });
  });

  it('disables the button and says so while the request is in flight', async () => {
    let release: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (release = r))));
    renderForm();
    await fill();
    await submit();
    expect(await screen.findByRole('button', { name: 'Placing order…' })).toBeDisabled();
    release(json({ id: 'ord_1', totalCents: 1, createdAt: 'x' }, 201));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled());
  });
});

describe('CheckoutForm: server errors', () => {
  it('maps server-side validation issues onto the fields and keeps the cart', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Validation failed', code: 'VALIDATION_ERROR', issues: [{ path: 'customer.email', message: 'Email already blocked' }] }, 400)));
    const onSuccess = renderForm();
    await fill();
    await submit();
    expect(await screen.findByText('Email already blocked')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInvalid();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(cart.getSnapshot()).toHaveLength(1);
  });

  it('shows a business error (out of stock) as an alert and keeps the cart', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Not enough stock for Product a', code: 'OUT_OF_STOCK' }, 409)));
    renderForm();
    await fill();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Not enough stock for Product a');
    expect(cart.getSnapshot()).toHaveLength(1);
  });

  it('shows the generic server message for a 500 without inventing details', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)));
    renderForm();
    await fill();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
  });
});
