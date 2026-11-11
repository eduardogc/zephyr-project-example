import { useState } from 'react';
import type { Product } from '@shop/types';
import { ProductArt } from '../ProductArt';
import { cn } from '../../lib/cn';
import { THUMBS } from './photos';

type Props = { product: Pick<Product, 'id' | 'emoji' | 'hue'>; className?: string; eager?: boolean };

/**
 * Product thumbnail. Decorative by default (`alt=""`): it always sits next to the product name,
 * so announcing the name twice would only add noise for screen-reader users.
 * Falls back to the generated emoji art for products without a photo.
 */
export function ProductPhoto({ product, className, eager = false }: Props) {
  const src = THUMBS[product.id];
  const [loaded, setLoaded] = useState(false);
  if (!src) return <ProductArt emoji={product.emoji} hue={product.hue} className={className} />;

  return (
    <div className={cn('overflow-hidden bg-border', className)}>
      <img
        src={src}
        alt=""
        width={640}
        height={640}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn('size-full object-cover motion-safe:transition-opacity motion-safe:duration-500', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  );
}
