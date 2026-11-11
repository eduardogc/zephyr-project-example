import { render, screen } from '@testing-library/react';
import { ProductSkeleton } from './ProductSkeleton';

describe('ProductSkeleton', () => {
  it('announces loading to screen readers and marks the area busy', () => {
    const { container } = render(<ProductSkeleton />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading product…');
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  it('shows placeholder blocks that are hidden from assistive tech', () => {
    const { container } = render(<ProductSkeleton />);
    const blocks = container.querySelectorAll('.shop-skeleton');
    expect(blocks.length).toBeGreaterThanOrEqual(4);
    blocks.forEach((b) => expect(b).toHaveAttribute('aria-hidden', 'true'));
  });
});
