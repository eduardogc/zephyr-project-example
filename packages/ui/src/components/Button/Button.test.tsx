import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to type=button so it never submits a form by accident', () => {
    render(<Button>Buy</Button>);
    expect(screen.getByRole('button', { name: 'Buy' })).toHaveAttribute('type', 'button');
  });

  it('can be a submit button', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('respects disabled and does not fire clicks', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Buy</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(screen.getByRole('button', { name: 'Buy' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onClick and merges custom classes', async () => {
    const onClick = vi.fn();
    render(<Button variant="outline" className="extra" onClick={onClick}>Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
    expect(btn).toHaveClass('extra', 'border-border');
  });
});
