import { Link } from 'react-router';
import { formatPrice, type Product } from '@shop/types';
import { ProductArt, Rating } from '@shop/ui';

export function ProductCard({ product }: { product: Product }) {
  return (
    <li className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-lg">
      <Link to={`/products/${product.id}`} className="block focus-visible:outline-2 focus-visible:outline-brand">
        <ProductArt emoji={product.emoji} hue={product.hue} className="motion-safe:transition motion-safe:group-hover:scale-105" />
        <div className="space-y-1 p-4">
          <h2 className="font-semibold">{product.name}</h2>
          <div className="flex items-center justify-between">
            <span className="font-medium">{formatPrice(product.priceCents)}</span>
            <Rating value={product.rating} />
          </div>
          {product.stock === 0 && <p className="text-sm font-medium text-danger">Out of stock</p>}
        </div>
      </Link>
    </li>
  );
}
