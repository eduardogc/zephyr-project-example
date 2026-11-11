import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive tech and accepts a custom size', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveClass('shop-skeleton', 'h-10', 'w-20');
  });
});
