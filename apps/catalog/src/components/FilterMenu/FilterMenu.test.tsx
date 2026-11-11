import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../test/axe';
import { FilterMenu } from './FilterMenu';

const setup = (props: Partial<React.ComponentProps<typeof FilterMenu>> = {}) => {
  const handlers = { onCategory: vi.fn(), onSort: vi.fn(), onClear: vi.fn() };
  const utils = render(<FilterMenu category={undefined} sort="featured" {...handlers} {...props} />);
  return { ...utils, ...handlers };
};
const open = (name = 'Filters') => userEvent.click(screen.getByRole('button', { name }));

describe('FilterMenu', () => {
  it('is a labelled disclosure button that reflects open/closed state', async () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('announces how many filters are active', () => {
    setup({ category: 'audio', sort: 'rating' });
    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeInTheDocument();
  });

  it('has no axe violations when open, with filters applied', async () => {
    const { container } = setup({ category: 'audio', sort: 'price-asc' });
    await open('Filters, 2 active');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('groups category and sort radios under labelled fieldsets, reflecting the current values', async () => {
    setup({ category: 'home', sort: 'price-desc' });
    await open('Filters, 2 active');
    const category = screen.getByRole('group', { name: 'Category' });
    expect(within(category).getAllByRole('radio').map((r) => r.getAttribute('aria-checked') ?? (r as HTMLInputElement).checked)).toContain(true);
    expect(within(category).getByRole('radio', { name: 'home' })).toBeChecked();
    expect(within(screen.getByRole('group', { name: 'Sort by' })).getByRole('radio', { name: 'Price: high to low' })).toBeChecked();
  });

  it('reports category and sort picks (and "All" as undefined)', async () => {
    const { onCategory, onSort } = setup({ category: 'home' });
    await open('Filters, 1 active');
    await userEvent.click(screen.getByRole('radio', { name: 'audio' }));
    expect(onCategory).toHaveBeenCalledWith('audio');
    await userEvent.click(screen.getByRole('radio', { name: 'All' }));
    expect(onCategory).toHaveBeenLastCalledWith(undefined);
    await userEvent.click(screen.getByRole('radio', { name: 'Top rated' }));
    expect(onSort).toHaveBeenCalledWith('rating');
  });

  it('offers "Clear filters" only when something is active, and clears in ONE call', async () => {
    const idle = setup();
    await open();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    idle.unmount();

    const { onClear, onCategory, onSort } = setup({ category: 'audio' });
    await open('Filters, 1 active');
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(onCategory).not.toHaveBeenCalled(); // two separate URL updates would overwrite each other
    expect(onSort).not.toHaveBeenCalled();
  });
});
