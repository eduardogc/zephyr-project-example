import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const remote = vi.hoisted(() => ({ fail: false }));
vi.mock('../../remotes', () => ({
  CartButton: () => {
    if (remote.fail) throw new Error('cart remote is down');
    return <a href="/cart">Cart (remote)</a>;
  },
}));
import { Header } from './Header';

afterEach(() => {
  remote.fail = false;
  vi.restoreAllMocks();
});

describe('Header', () => {
  it('is a banner with a labelled main navigation, a home link and the cart remote', async () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zephyr Shop' })).toHaveAttribute('href', '/');
    expect(await screen.findByRole('link', { name: 'Cart (remote)' })).toBeInTheDocument();
  });

  it('survives a broken cart remote: the rest of the header still works', () => {
    remote.fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText('cart unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zephyr Shop' })).toBeInTheDocument();
  });
});
