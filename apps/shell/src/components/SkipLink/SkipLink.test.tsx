import { render, screen } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('points at the main content and stays visually hidden until focused', () => {
    render(<SkipLink targetId="main" />);
    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link).toHaveAttribute('href', '#main');
    expect(link).toHaveClass('sr-only', 'focus:not-sr-only');
  });
});
