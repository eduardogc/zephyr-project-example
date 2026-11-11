import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product, ProductPage } from '@shop/types';

vi.mock('@shop/api-client', async (orig) => ({ ...(await orig<typeof import('@shop/api-client')>()), api: { listProducts: vi.fn() } }));
import { api } from '@shop/api-client';
import CatalogPage from './CatalogPage';

const list = vi.mocked(api.listProducts);
const make = (id: string, over: Partial<Product> = {}): Product => ({
  id, name: `Product ${id}`, description: 'desc', category: 'audio', priceCents: 1000, rating: 4, stock: 5, emoji: '📦', hue: 10, ...over,
});
const page = (items: Product[], total = items.length): ProductPage => ({ items, total, page: 1, pageSize: 8 });

function LocationProbe() {
  const { search } = useLocation();
  return <div data-testid="url">{search}</div>; // not <output>: that has an implicit status role
}
const renderAt = (url = '/') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[url]}>
        <CatalogPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => list.mockReset());

describe('CatalogPage', () => {
  it('shows a busy skeleton while loading, then the products and a count', async () => {
    list.mockResolvedValue(page([make('a'), make('b')]));
    renderAt();
    expect(screen.getByRole('status')).toHaveTextContent('Loading products…');
    expect(screen.getByRole('list', { name: 'Loading products' })).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByRole('heading', { level: 2, name: 'Product a' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 products');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('reads filters from the URL and passes them to the API', async () => {
    list.mockResolvedValue(page([make('a')]));
    renderAt('/?q=lamp&category=audio&sort=price-asc&page=2');
    await screen.findByText('Product a');
    expect(list).toHaveBeenCalledWith({ search: 'lamp', category: 'audio', sort: 'price-asc', page: 2 });
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toHaveValue('lamp');
    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeInTheDocument();
  });

  it('ignores invalid URL params instead of crashing', async () => {
    list.mockResolvedValue(page([make('a')]));
    renderAt('/?category=bogus&sort=bogus&page=abc');
    await screen.findByText('Product a');
    expect(list).toHaveBeenCalledWith({ search: undefined, category: undefined, sort: 'featured', page: 1 });
  });

  it('debounces typing, shows the busy state, then updates the URL and results', async () => {
    list.mockImplementation(async (q) => page(q?.search ? [make('lamp')] : [make('a'), make('b')]));
    renderAt();
    await screen.findByText('Product a');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'lamp');
    expect(list).toHaveBeenCalledTimes(1); // nothing fired mid-typing
    expect(screen.getByRole('status')).toHaveTextContent('Updating results…');

    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('?q=lamp'), { timeout: 2000 });
    expect(await screen.findByText('Product lamp')).toBeInTheDocument();
    expect(screen.queryByText('Product a')).not.toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'lamp', page: 1 }));
  });

  it('filters by category from the dropdown and shows a removable chip', async () => {
    list.mockImplementation(async (q) => page(q?.category === 'home' ? [make('h', { category: 'home' })] : [make('a'), make('b')]));
    renderAt();
    await screen.findByText('Product a');

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(within(screen.getByRole('group', { name: 'Category' })).getByRole('radio', { name: 'home' }));
    expect(await screen.findByText('Product h')).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('category=home');

    await userEvent.click(screen.getByRole('button', { name: 'Remove category filter home' }));
    expect(await screen.findByText('Product a')).toBeInTheDocument();
    expect(screen.getByTestId('url')).not.toHaveTextContent('category');
  });

  it('sorts via the dropdown and clears everything with "Clear filters"', async () => {
    list.mockResolvedValue(page([make('a')]));
    renderAt('/?category=audio&sort=rating');
    await screen.findByText('Product a');
    await userEvent.click(screen.getByRole('button', { name: 'Filters, 2 active' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent(/^$/));
    expect(list).toHaveBeenLastCalledWith({ search: undefined, category: undefined, sort: 'featured', page: 1 });
  });

  it('paginates', async () => {
    list.mockImplementation(async (q) => ({ items: [make(`p${q?.page ?? 1}`)], total: 20, page: q?.page ?? 1, pageSize: 8 }));
    renderAt();
    await screen.findByText('Product p1');
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByText('Page 1 of 3')).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Previous/ })).toBeDisabled();
    await userEvent.click(within(nav).getByRole('button', { name: /Next/ }));
    expect(await screen.findByText('Product p2')).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('page=2');
  });

  it('shows an empty state', async () => {
    list.mockResolvedValue(page([]));
    renderAt('/?q=zzz');
    expect(await screen.findByText('No products match your filters.')).toBeInTheDocument();
  });

  it('shows an error with retry that recovers', async () => {
    list.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(page([make('a')]));
    renderAt();
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the products.");
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Product a')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('marks out-of-stock products', async () => {
    list.mockResolvedValue(page([make('a', { stock: 0 })]));
    renderAt();
    expect(await screen.findByText('Out of stock')).toBeInTheDocument();
  });
});
