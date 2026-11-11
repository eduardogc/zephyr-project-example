import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@shop/types';
import { CartLineItem } from './CartLineItem';

const product: Product = { id: 'aero-buds', name: 'Aero Buds Pro', description: 'd', category: 'audio', priceCents: 1500, rating: 4, stock: 9, emoji: '🎧', hue: 1 };

const setup = (quantity = 2, over: Partial<Product> = {}) => {
  const onChangeQuantity = vi.fn();
  const onRemove = vi.fn();
  const utils = render(
    <MemoryRouter>
      <ul>
        <CartLineItem line={{ product: { ...product, ...over }, quantity }} onChangeQuantity={onChangeQuantity} onRemove={onRemove} />
      </ul>
    </MemoryRouter>,
  );
  return { ...utils, onChangeQuantity, onRemove };
};

describe('CartLineItem', () => {
  it('shows the product (linked), unit price and the line total', () => {
    setup(2);
    expect(screen.getByRole('link', { name: 'Aero Buds Pro' })).toHaveAttribute('href', '/products/aero-buds');
    expect(screen.getByText('$15.00')).toBeInTheDocument(); // unit
    expect(screen.getByText('$30.00')).toBeInTheDocument(); // 2 × 15
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('reports quantity changes with the NEW quantity', async () => {
    const { onChangeQuantity } = setup(2);
    const group = screen.getByRole('group', { name: 'Quantity of Aero Buds Pro' });
    await userEvent.click(within(group).getByRole('button', { name: 'Increase quantity' }));
    expect(onChangeQuantity).toHaveBeenLastCalledWith(3);
    await userEvent.click(within(group).getByRole('button', { name: 'Decrease quantity' }));
    expect(onChangeQuantity).toHaveBeenLastCalledWith(1);
  });

  it('decreasing from 1 asks for 0 (the cart store removes the line)', async () => {
    const { onChangeQuantity } = setup(1);
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChangeQuantity).toHaveBeenCalledWith(0);
  });

  it.each([
    ['the stock', 3, { stock: 3 }],
    ['10 per product', 10, { stock: 99 }],
  ])('cannot go above %s', (_label, quantity, over) => {
    setup(quantity, over);
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('removes the line with a button named after the product', async () => {
    const { onRemove } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Aero Buds Pro' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('keeps DOM order = tab order: link, decrease, increase, remove', async () => {
    setup();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Aero Buds Pro' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove Aero Buds Pro' })).toHaveFocus();
  });

  it('is laid out with flexbox only (no CSS grid)', () => {
    const { container } = setup();
    const classes = [...container.querySelectorAll('*')].flatMap((el) => [...el.classList]);
    expect(classes.filter((c) => /(^|:)(inline-)?grid($|-)/.test(c))).toEqual([]);
    expect(container.querySelector('li')).toHaveClass('flex');
  });
});
