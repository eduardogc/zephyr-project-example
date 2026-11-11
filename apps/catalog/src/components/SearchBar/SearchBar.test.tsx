import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../test/axe';
import { SearchBar } from './SearchBar';

const field = () => screen.getByRole('searchbox', { name: 'Search products' });

describe('SearchBar', () => {
  it('has no axe violations, idle or loading', async () => {
    const { container, rerender } = render(<SearchBar value="" onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<SearchBar value="lamp" onChange={() => {}} loading />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('reports typing through onChange', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    await userEvent.type(field(), 'ab');
    expect(onChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onChange).toHaveBeenNthCalledWith(2, 'b');
  });

  it('clears with the button (and keeps focus in the field)', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="lamp" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(field()).toHaveFocus();
  });

  it('clears with Escape, but only when there is something to clear', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);
    field().focus();
    await userEvent.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    rerender(<SearchBar value="lamp" onChange={onChange} />);
    await userEvent.keyboard('{Escape}');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows the "/" shortcut hint only while empty, and "/" focuses the field', async () => {
    const { rerender, container } = render(<SearchBar value="" onChange={() => {}} />);
    expect(container.querySelector('kbd')).toHaveTextContent('/');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await userEvent.keyboard('/');
    expect(field()).toHaveFocus();
    rerender(<SearchBar value="x" onChange={() => {}} />);
    expect(container.querySelector('kbd')).not.toBeInTheDocument();
  });

  it('does not hijack "/" while typing in another input', async () => {
    const onChange = vi.fn();
    render(
      <>
        <input aria-label="other" />
        <SearchBar value="" onChange={onChange} />
      </>,
    );
    await userEvent.type(screen.getByLabelText('other'), '/');
    expect(screen.getByLabelText('other')).toHaveFocus();
    expect(screen.getByLabelText('other')).toHaveValue('/');
  });

  it('swaps the magnifier for a spinner while loading', () => {
    const { container, rerender } = render(<SearchBar value="a" onChange={() => {}} />);
    const before = container.querySelector('svg')!.getAttribute('class');
    rerender(<SearchBar value="a" onChange={() => {}} loading />);
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('motion-safe:animate-spin');
    expect(before).not.toContain('animate-spin');
  });
});
