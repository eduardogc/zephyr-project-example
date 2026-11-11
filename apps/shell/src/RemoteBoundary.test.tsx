import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { lazy } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteBoundary } from './RemoteBoundary';

let shouldFail = true;
function Flaky() {
  if (shouldFail) throw new Error('remote is down');
  return <p>remote content</p>;
}

beforeEach(() => {
  shouldFail = true;
  vi.spyOn(console, 'error').mockImplementation(() => {}); // React + the boundary log expected errors
});
afterEach(() => vi.restoreAllMocks());

describe('RemoteBoundary', () => {
  it('renders the remote when it works', () => {
    shouldFail = false;
    render(<RemoteBoundary name="catalog"><Flaky /></RemoteBoundary>);
    expect(screen.getByText('remote content')).toBeInTheDocument();
  });

  it('isolates a failing remote: shows a retryable alert, then recovers', async () => {
    render(
      <>
        <header>still here</header>
        <RemoteBoundary name="catalog"><Flaky /></RemoteBoundary>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('The catalog section is temporarily unavailable.');
    expect(screen.getByText('still here')).toBeInTheDocument();

    shouldFail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('remote content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses a compact message for inline remotes (header cart button)', () => {
    render(<RemoteBoundary name="cart" inline><Flaky /></RemoteBoundary>);
    expect(screen.getByText('cart unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('shows a fallback while a lazy remote is loading', async () => {
    let resolve: (m: { default: () => JSX.Element }) => void = () => {};
    const Lazy = lazy(() => new Promise<{ default: () => JSX.Element }>((r) => (resolve = r)));
    render(<RemoteBoundary name="product"><Lazy /></RemoteBoundary>);
    expect(screen.queryByText('loaded')).not.toBeInTheDocument();
    resolve({ default: () => <p>loaded</p> });
    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });

  it('logs which remote failed', () => {
    render(<RemoteBoundary name="product"><Flaky /></RemoteBoundary>);
    expect(console.error).toHaveBeenCalledWith('[shell] remote "product" failed', expect.any(Error));
  });
});
