import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Product } from '@shop/types';
import { ProductImage } from './ProductImage';
import { PRODUCT_PHOTOS } from './productPhotos';

const product: Product = { id: 'pulse-watch', name: 'Pulse Watch 3', description: 'd', category: 'wearables', priceCents: 24900, rating: 4.5, stock: 3, emoji: '⌚', hue: 150 };

describe('ProductImage', () => {
  it('shows the product photo with a descriptive alt text, faded in once loaded', () => {
    render(<ProductImage product={product} />);
    const img = screen.getByRole('img', { name: 'Pulse Watch 3' });
    expect(img).toHaveAttribute('src', expect.stringContaining('pulse-watch'));
    expect(img).toHaveClass('opacity-0');
    fireEvent.load(img);
    expect(img).toHaveClass('opacity-100');
  });

  it('credits the photographer and Unsplash with safe external links', () => {
    render(<ProductImage product={product} />);
    const photographer = screen.getByRole('link', { name: 'Simon Daoudi' });
    expect(photographer).toHaveAttribute('href', expect.stringContaining('unsplash.com/photos/2wFoa040m8g'));
    for (const link of [photographer, screen.getByRole('link', { name: 'Unsplash' })]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
      expect(link.getAttribute('href')).toContain('utm_source=zephyr_shop');
    }
  });

  it('falls back to generated art (no photo, no credit) for unknown products', () => {
    render(<ProductImage product={{ ...product, id: 'brand-new' }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('⌚')).toBeInTheDocument();
  });
});

describe('PRODUCT_PHOTOS', () => {
  it('covers the 12 catalogue products, each with a credit', () => {
    expect(Object.keys(PRODUCT_PHOTOS)).toHaveLength(12);
    for (const photo of Object.values(PRODUCT_PHOTOS)) {
      expect(photo.src).toBeTruthy();
      expect(photo.photographer).toBeTruthy();
      expect(photo.unsplashId).toMatch(/^[\w-]{11}$/);
    }
  });
});
