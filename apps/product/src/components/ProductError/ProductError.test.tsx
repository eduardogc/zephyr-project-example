import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@shop/api-client';
import { ProductError } from './ProductError';

const renderError = (error: unknown, onRetry = vi.fn()) => {
  render(<MemoryRouter><ProductError error={error} onRetry={onRetry} /></MemoryRouter>);
  return onRetry;
};

describe('ProductError', () => {
  it('404: says the product is gone and links back to the shop (no retry: it would not help)', () => {
    renderError(new ApiRequestError('Product not found', 404, [], 'NOT_FOUND'));
    expect(screen.getByRole('heading', { level: 1, name: 'Product not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the shop' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it.each([
    ['a server error', new ApiRequestError('Internal server error', 500, [], 'INTERNAL_ERROR')],
    ['a business error other than 404', new ApiRequestError('Conflict', 409, [], 'CONFLICT')],
    ['a network failure', new TypeError('Failed to fetch')],
    ['no error object at all', undefined],
  ])('%s: shows a retryable alert', async (_label, error) => {
    const onRetry = renderError(error);
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load this product.");
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
