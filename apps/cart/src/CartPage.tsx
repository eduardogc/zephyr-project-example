import './styles.css'; // the exposed module owns its CSS: bootstrap.tsx is not loaded when the shell embeds this remote
import { useState } from 'react';
import { Link } from 'react-router';
import { formatPrice, type Order } from '@shop/types';
import { Button, CheckCircleIcon, MinusIcon, PlusIcon, TrashIcon } from '@shop/ui';
import { ProductPhoto } from '@shop/ui/product-photo';
import { cart, useCart } from './cartStore';
import { CheckoutForm } from './CheckoutForm';

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
    <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <section aria-labelledby="cart-title" className="space-y-4">
        <h1 id="cart-title" className="text-3xl font-bold">Your cart</h1>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-center gap-4 p-4">
              <ProductPhoto product={product} className="size-16 shrink-0 rounded-lg text-3xl" />
              <div className="flex-1">
                <Link to={`/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                <p className="text-sm text-muted">{formatPrice(product.priceCents)}</p>
              </div>
              <div role="group" aria-label={`Quantity of ${product.name}`} className="flex items-center">
                <Button variant="ghost" aria-label="Decrease quantity" onClick={() => cart.setQuantity(product.id, quantity - 1)}><MinusIcon aria-hidden className="size-4" /></Button>
                <output className="w-6 text-center">{quantity}</output>
                <Button variant="ghost" aria-label="Increase quantity" disabled={quantity >= Math.min(10, product.stock)} onClick={() => cart.setQuantity(product.id, quantity + 1)}><PlusIcon aria-hidden className="size-4" /></Button>
              </div>
              <p className="w-20 text-right font-medium">{formatPrice(product.priceCents * quantity)}</p>
              <Button variant="ghost" aria-label={`Remove ${product.name}`} onClick={() => cart.setQuantity(product.id, 0)}><TrashIcon aria-hidden className="size-5" /></Button>
            </li>
          ))}
        </ul>
        <p className="text-right text-lg">
          Total: <strong>{formatPrice(totalCents)}</strong>
        </p>
      </section>
      <aside className="rounded-xl border border-border bg-surface p-5 md:self-start">
        <CheckoutForm items={items} onSuccess={setPlaced} />
      </aside>
    </div>
  );
}
