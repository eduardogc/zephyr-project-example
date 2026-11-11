import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The federated remotes are replaced by tiny stand-ins: this tests the shell's own wiring.
vi.mock('./remotes', () => ({
  CatalogPage: () => (
    <>
      <h1>Catalog (remote)</h1>
      <Link to="/products/aero-buds">open product</Link>
    </>
  ),
  ProductPage: () => <h1>Product (remote)</h1>,
  CartPage: () => <h1>Cart (remote)</h1>,
  CartButton: () => <span>cart button</span>,
}));
import App from './App';

const visit = (path: string) => window.history.pushState({}, '', path);
beforeEach(() => visit('/'));

describe('App routing', () => {
  it.each([
    ['/', 'Catalog (remote)'],
    ['/products/aero-buds', 'Product (remote)'],
    ['/cart', 'Cart (remote)'],
    ['/definitely-not-here', 'Page not found'],
  ])('%s renders %s', async (path, heading) => {
    visit(path);
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('wraps every page in the shared landmarks', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Catalog (remote)' });
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('sets the page title and moves focus to <main> after navigating', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('link', { name: 'open product' }));
    expect(await screen.findByRole('heading', { name: 'Product (remote)' })).toBeInTheDocument();
    expect(document.title).toBe('Product · Zephyr Shop');
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
