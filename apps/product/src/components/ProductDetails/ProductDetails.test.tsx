import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CART_ADD_EVENT, type CartAddDetail, type Product } from '@shop/types';
import { ProductDetails } from './ProductDetails';

const product: Product = { id: 'aero-buds', name: 'Aero Buds Pro', description: 'Great earbuds', category: 'audio', priceCents: 12900, rating: 4.7, stock: 24, emoji: '🎧', hue: 215 };
const renderDetails = (p: Product = product) => render(<MemoryRouter><ProductDetails product={p} /></MemoryRouter>);
const plus = () => screen.getByRole('button', { name: 'Increase quantity' });
const minus = () => screen.getByRole('button', { name: 'Decrease quantity' });

afterEach(() => vi.useRealTimers());

describe('ProductDetails: content', () => {
  it('shows name, price, rating, description and the photo with its credit', () => {
    renderDetails();
    expect(screen.getByRole('heading', { level: 1, name: 'Aero Buds Pro' })).toBeInTheDocument();
    expect(screen.getByText('$129.00')).toBeInTheDocument();
    expect(screen.getByLabelText('Rated 4.7 out of 5')).toBeInTheDocument();
    expect(screen.getByText('Great earbuds')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Aero Buds Pro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Daniel Romero' })).toBeInTheDocument();
  });

  it('has a breadcrumb list: a link back to the shop, then the current category', () => {
    renderDetails();
    const items = within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getAllByRole('listitem');
    expect(items).toHaveLength(2); // the "/" separator is decorative (aria-hidden)
    expect(within(items[0]!).getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/');
    expect(items[1]).toHaveAttribute('aria-current', 'page');
    expect(items[1]).toHaveTextContent('audio');
  });

  it.each([
    [24, 'In stock'],
    [6, 'In stock'],
    [5, 'Only 5 left'],
    [1, 'Only 1 left'],
    [0, 'Out of stock'],
  ])('stock %i is described as "%s"', (stock, label) => {
    renderDetails({ ...product, stock });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('falls back to generated art for products without a photo', () => {
    renderDetails({ ...product, id: 'new-thing', name: 'New Thing' });
    expect(screen.queryByRole('img', { name: 'New Thing' })).not.toBeInTheDocument();
  });
});

describe('ProductDetails: quantity', () => {
  it('starts at 1 and cannot go below it', async () => {
    renderDetails();
    expect(screen.getByRole('group', { name: 'Quantity' })).toHaveTextContent('1');
    expect(minus()).toBeDisabled();
    await userEvent.click(plus());
    expect(minus()).toBeEnabled();
    await userEvent.click(minus());
    expect(minus()).toBeDisabled();
  });

  it('cannot exceed the stock', async () => {
    renderDetails({ ...product, stock: 2 });
    await userEvent.click(plus());
    expect(plus()).toBeDisabled();
  });

  it('cannot exceed 10 per order even with plenty of stock', async () => {
    renderDetails({ ...product, stock: 99 });
    for (let i = 0; i < 12; i++) if (!(plus() as HTMLButtonElement).disabled) await userEvent.click(plus());
    expect(screen.getByRole('group', { name: 'Quantity' })).toHaveTextContent('10');
    expect(plus()).toBeDisabled();
  });
});

describe('ProductDetails: sold out', () => {
  it('disables every purchase control and shows 0', () => {
    renderDetails({ ...product, stock: 0 });
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    expect(plus()).toBeDisabled();
    expect(minus()).toBeDisabled();
    expect(screen.getByRole('group', { name: 'Quantity' })).toHaveTextContent('0');
  });
});

describe('ProductDetails: add to cart', () => {
  it('announces the chosen quantity through a window event (the cart remote listens)', async () => {
    const onAdd = vi.fn((e: Event) => (e as CustomEvent<CartAddDetail>).detail);
    window.addEventListener(CART_ADD_EVENT, onAdd);
    renderDetails();
    await userEvent.click(plus());
    await userEvent.click(plus());
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    window.removeEventListener(CART_ADD_EVENT, onAdd);

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd.mock.results[0]!.value).toEqual({ product, quantity: 3 });
  });

  it('confirms in a status region, then hides the message after a moment', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderDetails();
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(screen.getByText('Added 1 × Aero Buds Pro to your cart')).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(2600));
    expect(screen.queryByText(/Added 1 ×/)).not.toBeInTheDocument();
  });

  it('does not touch state after unmount (the timer is cleaned up)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderDetails();
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    unmount();
    act(() => void vi.advanceTimersByTime(5000));
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
