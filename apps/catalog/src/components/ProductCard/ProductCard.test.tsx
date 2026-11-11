import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Product } from '@shop/types';
import { axe } from '../../test/axe';
import { ProductCard } from './ProductCard';

const product: Product = { id: 'aero-buds', name: 'Aero Buds Pro', description: 'Noise cancelling earbuds', category: 'audio', priceCents: 12900, rating: 4.7, stock: 5, emoji: '🎧', hue: 1 };
const renderCard = (p: Product = product, eager = false) =>
  render(
    <MemoryRouter>
      <ul>
        <ProductCard product={p} eager={eager} />
      </ul>
    </MemoryRouter>,
  );

describe('ProductCard', () => {
  it('is one link to the product page, named after the product, with a level-2 heading', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/aero-buds');
    expect(screen.getByRole('link')).toHaveAccessibleName(/Aero Buds Pro/);
    expect(screen.getByRole('heading', { level: 2, name: 'Aero Buds Pro' })).toBeInTheDocument();
  });

  it('shows price and rating', () => {
    renderCard();
    expect(screen.getByText('$129.00')).toBeInTheDocument();
    expect(screen.getByLabelText('Rated 4.7 out of 5')).toBeInTheDocument();
  });

  it('flags out-of-stock products only', () => {
    const { unmount } = renderCard();
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
    unmount();
    renderCard({ ...product, stock: 0 });
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('uses a decorative photo and lets above-the-fold cards load eagerly', () => {
    const { container, unmount } = renderCard();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    unmount();
    expect(renderCard(product, true).container.querySelector('img')).toHaveAttribute('loading', 'eager');
  });

  it('has no axe violations', async () => {
    const { container } = renderCard();
    expect(await axe(container)).toHaveNoViolations();
  });
});
