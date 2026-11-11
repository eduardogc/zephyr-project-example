import { render } from '@testing-library/react';
import { ProductArt } from './ProductArt';

describe('ProductArt', () => {
  it('renders the emoji as decorative content with a hue-based gradient', () => {
    const { container } = render(<ProductArt emoji="🎧" hue={200} className="rounded" />);
    const art = container.firstChild as HTMLElement;
    expect(art).toHaveAttribute('aria-hidden', 'true');
    expect(art).toHaveTextContent('🎧');
    expect(art).toHaveClass('rounded');
    expect(art.style.background).toContain('linear-gradient');
  });
});
