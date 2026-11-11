import { fireEvent, render, screen } from '@testing-library/react';
import { ProductPhoto } from './ProductPhoto';

describe('ProductPhoto', () => {
  it('renders a decorative photo (empty alt: the name sits next to it) that fades in once loaded', () => {
    const { container } = render(<ProductPhoto product={{ id: 'aero-buds', emoji: '🎧', hue: 1 }} className="aspect-square" />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', expect.stringContaining('aero-buds'));
    expect(img).toHaveClass('opacity-0');
    fireEvent.load(img);
    expect(img).toHaveClass('opacity-100');
    expect(container.firstChild).toHaveClass('aspect-square');
  });

  it('loads lazily unless told to be eager (above-the-fold images)', () => {
    const product = { id: 'glow-lamp', emoji: '💡', hue: 1 };
    const { container, rerender } = render(<ProductPhoto product={product} />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    rerender(<ProductPhoto product={product} eager />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
  });

  it('falls back to the generated emoji art for products without a photo', () => {
    const { container } = render(<ProductPhoto product={{ id: 'brand-new', emoji: '🧪', hue: 90 }} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('🧪');
  });
});
