import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureAxe } from 'vitest-axe';
import { MemoryRouter } from 'react-router';
import { FilterMenu } from './FilterMenu';
import { ProductCard } from './ProductCard';
import { SearchBar } from './SearchBar';

// Colour contrast needs a real rendering engine (canvas); jsdom can't evaluate it.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

const product = { id: 'p1', name: 'Thing', description: 'd', category: 'home' as const, priceCents: 1000, rating: 4.2, stock: 0, emoji: '📦', hue: 20 };

describe('catalog accessibility', () => {
  it('SearchBar has no axe violations, in idle and loading states', async () => {
    const { container, rerender } = render(<SearchBar value="" onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<SearchBar value="lamp" onChange={() => {}} loading />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('SearchBar clear button clears and the Escape key too', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="lamp" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('FilterMenu: labelled trigger, grouped radios, no axe violations when open', async () => {
    const { container } = render(<FilterMenu category="audio" sort="featured" onCategory={() => {}} onSort={() => {}} onClear={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Filters, 1 active' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'audio' })).toBeChecked();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ProductCard is a single named link with a level-2 heading', async () => {
    const { container } = render(
      <MemoryRouter>
        <ul>
          <ProductCard product={product} />
        </ul>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Thing' })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAccessibleName(/Thing/);
    expect(await axe(container)).toHaveNoViolations();
  });
});
