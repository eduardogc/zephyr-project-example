import '../../styles.css'; // the exposed module owns its CSS: bootstrap.tsx is not loaded when the shell embeds this remote
import { useState } from 'react';
import { Link } from 'react-router';
import { formatPrice, type Order } from '@shop/types';
import { Button, CheckCircleIcon, MinusIcon, PlusIcon, TrashIcon } from '@shop/ui';
import { ProductPhoto } from '@shop/ui/product-photo';
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
    <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <section aria-labelledby="cart-title" className="space-y-4">
        <h1 id="cart-title" className="text-3xl font-bold">Your cart</h1>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {items.map(({ product, quantity }) => (
            // Mobile: two rows (photo · name · delete / quantity · line price). From `sm`: one row of five columns.
            <li key={product.id} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto_5rem_auto]">
              <ProductPhoto product={product} className="size-16 shrink-0 rounded-lg text-3xl" />
              <div className="min-w-0">
                <Link to={`/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                <p className="text-sm text-muted">{formatPrice(product.priceCents)}</p>
              </div>
              <div role="group" aria-label={`Quantity of ${product.name}`} className="col-span-2 col-start-1 row-start-2 flex items-center justify-self-start rounded-lg border border-border sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:border-0">
                <Button variant="ghost" aria-label="Decrease quantity" onClick={() => cart.setQuantity(product.id, quantity - 1)}><MinusIcon aria-hidden className="size-4" /></Button>
                <output className="w-6 text-center">{quantity}</output>
                <Button variant="ghost" aria-label="Increase quantity" disabled={quantity >= Math.min(10, product.stock)} onClick={() => cart.setQuantity(product.id, quantity + 1)}><PlusIcon aria-hidden className="size-4" /></Button>
              </div>
              <p className="col-start-3 row-start-2 text-right font-medium sm:col-start-4 sm:row-start-1">{formatPrice(product.priceCents * quantity)}</p>
              <Button variant="ghost" className="col-start-3 row-start-1 -mr-2 justify-self-end sm:col-start-5 sm:mr-0" aria-label={`Remove ${product.name}`} onClick={() => cart.setQuantity(product.id, 0)}><TrashIcon aria-hidden className="size-5" /></Button>
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
