import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Link, MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RouteEffects, titleFor } from './RouteEffects';

describe('titleFor', () => {
  it.each([
    ['/', 'Shop · Zephyr Shop'],
    ['/products/aero-buds', 'Product · Zephyr Shop'],
    ['/cart', 'Your cart · Zephyr Shop'],
    ['/nowhere', 'Not found · Zephyr Shop'],
    ['/cart/extra', 'Not found · Zephyr Shop'],
  ])('%s -> %s', (path, title) => expect(titleFor(path)).toBe(title));
});

describe('RouteEffects', () => {
  const setup = (initial = '/') => {
    const mainRef = createRef<HTMLElement>();
    render(
      <MemoryRouter initialEntries={[initial]}>
        <RouteEffects mainRef={mainRef} />
        <Link to="/cart">go to cart</Link>
        <main ref={mainRef} tabIndex={-1}>content</main>
      </MemoryRouter>,
    );
    return mainRef;
  };

  it('sets the document title on load WITHOUT stealing focus', () => {
    const main = setup('/cart');
    expect(document.title).toBe('Your cart · Zephyr Shop');
    expect(main.current).not.toHaveFocus();
  });

  it('updates the title and moves focus to <main> after in-app navigation', async () => {
    const main = setup('/');
    expect(document.title).toBe('Shop · Zephyr Shop');
    await userEvent.click(screen.getByRole('link', { name: 'go to cart' }));
    expect(document.title).toBe('Your cart · Zephyr Shop');
    expect(main.current).toHaveFocus();
  });
});
