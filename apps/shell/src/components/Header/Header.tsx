import { Link } from 'react-router';
import { BoltIcon } from '@shop/ui';
import { CartButton } from '../../remotes';
import { RemoteBoundary } from '../RemoteBoundary';

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <BoltIcon aria-hidden className="size-6 text-brand" /> Zephyr Shop
        </Link>
        <RemoteBoundary name="cart" inline>
          <CartButton />
        </RemoteBoundary>
      </nav>
    </header>
  );
}
