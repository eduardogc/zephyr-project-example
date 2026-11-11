import { render } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is hidden from assistive tech, only animates when motion is allowed, and takes a custom class', () => {
    const { container } = render(<Spinner className="text-brand" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('motion-safe:animate-spin', 'text-brand');
  });
});
