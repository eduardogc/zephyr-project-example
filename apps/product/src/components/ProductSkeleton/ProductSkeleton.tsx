import { Skeleton } from '@shop/ui';

/** Loading view: same grid as the loaded product, so the page does not jump when data arrives. */
export function ProductSkeleton() {
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
