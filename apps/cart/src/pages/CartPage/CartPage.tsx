import '../../styles.css'; // the exposed module owns its CSS: bootstrap.tsx is not loaded when the shell embeds this remote
import { useState } from 'react';
import { Link } from 'react-router';
import { formatPrice, type Order } from '@shop/types';
import { CheckCircleIcon } from '@shop/ui';
import { CartLineItem } from '../../components/CartLineItem';
import { CheckoutForm } from '../../components/CheckoutForm';
import { cart, useCart } from '../../store/cartStore';

export default function CartPage() {
  const { items, totalCents } = useCart();
  const [placed, setPlaced] = useState<Order>();

  if (placed) {
    return (
      <div role="status" className="py-16 text-center">
        <CheckCircleIcon aria-hidden className="mx-auto size-16 text-brand" />
        <h1 className="mt-4 text-2xl font-bold">Thanks for your order!</h1>
        <p className="mt-2 text-muted">
          Order <strong>{placed.id}</strong> · {formatPrice(placed.totalCents)}
        </p>
        <Link to="/" className="mt-6 inline-block text-brand underline">Continue shopping</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/" className="mt-4 inline-block text-brand underline">Browse products</Link>
      </div>
    );
  }

  return (
    // Plain flexbox: stacked on mobile, side by side from `md`.
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <section aria-labelledby="cart-title" className="min-w-0 space-y-4 md:flex-1">
        <h1 id="cart-title" className="text-3xl font-bold">Your cart</h1>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {items.map((line) => (
            <CartLineItem
              key={line.product.id}
              line={line}
              onChangeQuantity={(quantity) => cart.setQuantity(line.product.id, quantity)}
              onRemove={() => cart.setQuantity(line.product.id, 0)}
            />
          ))}
        </ul>
        <p className="text-right text-lg">
          Total: <strong>{formatPrice(totalCents)}</strong>
        </p>
      </section>
      <aside className="rounded-xl border border-border bg-surface p-5 md:w-80 md:shrink-0">
        <CheckoutForm items={items} onSuccess={setPlaced} />
      </aside>
    </div>
  );
}
