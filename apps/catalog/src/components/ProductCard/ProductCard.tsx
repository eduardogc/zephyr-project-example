import { Link } from 'react-router';
import { formatPrice, type Product } from '@shop/types';
import { Rating } from '@shop/ui';
import { ProductPhoto } from '@shop/ui/product-photo';

/**
 * Mobile: "giant" card (one per row, square photo, large type).
 * sm and up: compact card for the 2/3-column grid (landscape photo, tighter spacing).
 */
export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  return (
    <li className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-lg sm:rounded-xl">
      <Link to={`/products/${product.id}`} className="block focus-visible:outline-2 focus-visible:outline-brand">
        <ProductPhoto
          product={product}
          eager={eager}
          className="aspect-square sm:aspect-[4/3] [&_img]:motion-safe:transition-transform [&_img]:motion-safe:duration-300 [&_img]:motion-safe:group-hover:scale-105"
        />
        <div className="space-y-2 p-5 sm:space-y-1 sm:p-4">
          <h2 className="text-xl font-semibold sm:text-base">{product.name}</h2>
          <p className="line-clamp-2 text-muted sm:hidden">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold sm:text-base sm:font-medium">{formatPrice(product.priceCents)}</span>
            <Rating value={product.rating} />
          </div>
          {product.stock === 0 && <p className="text-sm font-medium text-danger">Out of stock</p>}
        </div>
      </Link>
    </li>
  );
}
