import { render } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('is decorative and only visible while active (but keeps its space)', () => {
    const { container, rerender } = render(<ProgressBar active={false} />);
    const bar = container.firstChild as HTMLElement;
    expect(bar).toHaveAttribute('aria-hidden', 'true');
    expect(bar).toHaveClass('opacity-0');
    rerender(<ProgressBar active className="-mt-3" />);
    expect(bar).toHaveClass('opacity-100', '-mt-3');
  });
});
