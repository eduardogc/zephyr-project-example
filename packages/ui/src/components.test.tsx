import { render, screen } from '@testing-library/react';
import { Button, ErrorState, ProgressBar, Rating, Spinner } from './components';

describe('ui components', () => {
  it('Button defaults to type=button and respects disabled', () => {
    render(<Button disabled>Buy</Button>);
    const btn = screen.getByRole('button', { name: 'Buy' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toBeDisabled();
  });

  it('ErrorState announces the message and offers retry', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Boom" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('Rating exposes an accessible label', () => {
    render(<Rating value={4.25} />);
    expect(screen.getByLabelText('Rated 4.3 out of 5')).toBeInTheDocument();
  });

  it('Spinner and ProgressBar are hidden from assistive tech', () => {
    const { container } = render(
      <>
        <Spinner />
        <ProgressBar active />
      </>,
    );
    container.querySelectorAll('svg, div').forEach((el) => expect(el).toHaveAttribute('aria-hidden', 'true'));
  });
});
