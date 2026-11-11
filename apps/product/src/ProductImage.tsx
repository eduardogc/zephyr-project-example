import { useState } from 'react';
import type { Product } from '@shop/types';
import { ProductArt, Skeleton, cn } from '@shop/ui';
import { PRODUCT_PHOTOS } from './productImages';

export function ProductImage({ product }: { product: Product }) {
  const photo = PRODUCT_PHOTOS[product.id];
  const [loaded, setLoaded] = useState(false);

  // Unknown product id (e.g. added later in the API): fall back to the generated art.
  if (!photo) return <ProductArt emoji={product.emoji} hue={product.hue} className="rounded-2xl text-9xl" />;

  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-border">
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <img
          src={photo.src}
          alt={product.name}
          width={1000}
          height={1000}
          decoding="async"
          fetchPriority="high"
          onLoad={() => setLoaded(true)}
          className={cn('size-full object-cover motion-safe:transition-opacity motion-safe:duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        Photo by{' '}
        <a className="underline hover:text-text" href={`https://unsplash.com/photos/${photo.unsplashId}?utm_source=zephyr_shop&utm_medium=referral`} target="_blank" rel="noreferrer">
          {photo.photographer}
        </a>{' '}
        on{' '}
        <a className="underline hover:text-text" href="https://unsplash.com/?utm_source=zephyr_shop&utm_medium=referral" target="_blank" rel="noreferrer">
          Unsplash
        </a>
      </figcaption>
    </figure>
  );
}
