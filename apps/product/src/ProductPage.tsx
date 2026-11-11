import './styles.css'; // the exposed module owns its CSS: bootstrap.tsx is not loaded when the shell embeds this remote
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { api, ApiRequestError } from '@shop/api-client';
import { CART_ADD_EVENT, formatPrice, type CartAddDetail } from '@shop/types';
import { Button, ChevronLeftIcon, ErrorState, MinusIcon, PlusIcon, Rating, ShoppingCartIcon, Skeleton } from '@shop/ui';
import { ProductImage } from './ProductImage';

export default function ProductPage() {
  const { id = '' } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isPending, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    retry: (count, err) => !(err instanceof ApiRequestError && err.status === 404) && count < 2,
  });

  useEffect(() => {
    if (product) document.title = `${product.name} · Zephyr Shop`;
  }, [product]);

  if (isPending) {
    return (
      <div className="grid gap-8 md:grid-cols-2" aria-busy="true">
        <p role="status" className="sr-only">Loading product…</p>
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return notFound ? (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/" className="mt-4 inline-block text-brand underline">
          Back to the shop
        </Link>
      </div>
    ) : (
      <ErrorState message="We couldn't load this product." onRetry={() => refetch()} />
    );
  }

  const soldOut = product.stock === 0;
  const max = Math.min(10, product.stock);

  const addToCart = () => {
    window.dispatchEvent(
      new CustomEvent<CartAddDetail>(CART_ADD_EVENT, { detail: { product, quantity } }),
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/" className="inline-flex items-center gap-1 hover:underline">
          <ChevronLeftIcon aria-hidden className="size-4" /> Shop
        </Link>{' '}
        / <span className="capitalize">{product.category}</span>
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
          <p className={soldOut ? 'font-medium text-danger' : product.stock <= 5 ? 'font-medium text-warning' : 'text-muted'}>
            {soldOut ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
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
