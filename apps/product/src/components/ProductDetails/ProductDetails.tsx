import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CART_ADD_EVENT, formatPrice, type CartAddDetail, type Product } from '@shop/types';
import { Button, ChevronLeftIcon, MinusIcon, PlusIcon, Rating, ShoppingCartIcon } from '@shop/ui';
import { ProductImage } from '../ProductImage';

const MAX_PER_ORDER = 10;
const CONFIRMATION_MS = 2500;

/** The loaded product. Owns the quantity picker and the "added" confirmation; talks to the cart via a window event. */
export function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Hide the confirmation after a moment; the cleanup also covers leaving the page while it is showing.
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [added]);

  const soldOut = product.stock === 0;
  const max = Math.min(MAX_PER_ORDER, product.stock);
  const lowStock = !soldOut && product.stock <= 5;

  const addToCart = () => {
    window.dispatchEvent(new CustomEvent<CartAddDetail>(CART_ADD_EVENT, { detail: { product, quantity } }));
    setAdded(true);
  };

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb">
        {/* Flex all the way down: an inline-flex link inside a block <li> sits on the text baseline and ends up
            a couple of pixels higher than its siblings. A fixed line height keeps every item the same height. */}
        <ol className="flex items-center gap-2 text-sm leading-5 text-muted">
          <li className="flex items-center">
            <Link to="/" className="flex items-center gap-1 hover:underline">
              <ChevronLeftIcon aria-hidden className="size-4" /> Shop
            </Link>
          </li>
          <li aria-hidden className="flex items-center">/</li>
          <li aria-current="page" className="flex items-center capitalize">{product.category}</li>
        </ol>
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage product={product} />
        <div className="space-y-5">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-semibold">{formatPrice(product.priceCents)}</span>
            <Rating value={product.rating} />
          </div>
          <p className="text-muted">{product.description}</p>
          <p className={soldOut ? 'font-medium text-danger' : lowStock ? 'font-medium text-warning' : 'text-muted'}>
            {soldOut ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : 'In stock'}
          </p>

          <div className="flex items-center gap-4">
            <div role="group" aria-label="Quantity" className="flex items-center rounded-lg border border-border">
              <Button variant="ghost" aria-label="Decrease quantity" disabled={soldOut || quantity <= 1} onClick={() => setQuantity(quantity - 1)}><MinusIcon aria-hidden className="size-4" /></Button>
              <output aria-live="polite" className="w-8 text-center">{soldOut ? 0 : quantity}</output>
              <Button variant="ghost" aria-label="Increase quantity" disabled={soldOut || quantity >= max} onClick={() => setQuantity(quantity + 1)}><PlusIcon aria-hidden className="size-4" /></Button>
            </div>
            <Button disabled={soldOut} onClick={addToCart} className="flex-1 py-3">
              <ShoppingCartIcon aria-hidden className="size-5" /> Add to cart
            </Button>
          </div>
          <p role="status" className="h-5 text-sm text-brand">
            {added && `Added ${quantity} × ${product.name} to your cart`}
          </p>
        </div>
      </div>
    </article>
  );
}
