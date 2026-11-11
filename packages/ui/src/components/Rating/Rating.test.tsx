import { render, screen } from '@testing-library/react';
import { Rating } from './Rating';

describe('Rating', () => {
  it('exposes an accessible label with one decimal', () => {
    render(<Rating value={4.25} />);
    expect(screen.getByLabelText('Rated 4.3 out of 5')).toBeInTheDocument();
  });

  it('shows a visible number and hides the star icon from assistive tech', () => {
    const { container } = render(<Rating value={4} />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
