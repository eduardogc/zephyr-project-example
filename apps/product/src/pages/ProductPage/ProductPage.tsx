import '../../styles.css'; // the exposed module owns its CSS: bootstrap.tsx is not loaded when the shell embeds this remote
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { api, ApiRequestError } from '@shop/api-client';
import { ProductDetails } from '../../components/ProductDetails';
import { ProductError } from '../../components/ProductError';
import { ProductSkeleton } from '../../components/ProductSkeleton';

/** Fetches the product and picks the view for the current state. No markup of its own. */
export default function ProductPage() {
  const { id = '' } = useParams();

  const { data: product, isPending, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    // A 404 will not fix itself, so do not retry it; retry transient failures twice.
    retry: (count, err) => !(err instanceof ApiRequestError && err.status === 404) && count < 2,
  });

  useEffect(() => {
    if (product) document.title = `${product.name} · Zephyr Shop`;
  }, [product]);

  if (isPending) return <ProductSkeleton />;
  if (error || !product) return <ProductError error={error} onRetry={() => refetch()} />;
  // key: moving from one product to another starts with a fresh quantity and no stale "added" message
  return <ProductDetails key={product.id} product={product} />;
}
