import { Link } from 'react-router';
import { ShoppingCartIcon } from '@shop/ui';
import { useCart } from './cartStore';

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-border/50"
    >
      <ShoppingCartIcon aria-hidden className="size-5" />
      Cart
      {count > 0 && (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-brand px-1.5 text-center text-xs text-brand-contrast">
          {count}
        </span>
      )}
    </Link>
  );
}
