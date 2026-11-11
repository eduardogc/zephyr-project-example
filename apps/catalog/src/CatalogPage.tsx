import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { api } from '@shop/api-client';
import { CATEGORIES, SORTS, categorySchema, productQuerySchema } from '@shop/types';
import { Button, ErrorState, Skeleton, cn } from '@shop/ui';
import { ProductCard } from './ProductCard';
import { useDebounced } from './useDebounced';

const SORT_LABELS: Record<(typeof SORTS)[number], string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
};

/** Filter state lives in the URL, so every view is shareable and back/forward just works. */
export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const category = categorySchema.safeParse(params.get('category')).data;
  const sort = productQuerySchema.shape.sort.catch('featured').parse(params.get('sort') ?? undefined);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const urlSearch = params.get('q') ?? '';

  const [search, setSearch] = useState(urlSearch);
  const debounced = useDebounced(search);

  const update = (patch: Record<string, string | undefined>, resetPage = true) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (debounced !== urlSearch) update({ q: debounced || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, isPending, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ['products', { q: urlSearch, category, sort, page }],
    queryFn: () => api.listProducts({ search: urlSearch || undefined, category, sort, page }),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section aria-labelledby="catalog-title" className="space-y-6">
      <h1 id="catalog-title" className="text-3xl font-bold">
        Shop all products
      </h1>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 md:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          Sort by
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value === 'featured' ? undefined : e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {[undefined, ...CATEGORIES].map((c) => (
          <Button
            key={c ?? 'all'}
            variant={category === c ? 'primary' : 'outline'}
            aria-pressed={category === c}
            className="capitalize"
            onClick={() => update({ category: c })}
          >
            {c ?? 'All'}
          </Button>
        ))}
      </div>

      {isError ? (
        <ErrorState message="We couldn't load the products." onRetry={() => refetch()} />
      ) : isPending ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[3/4]" />
            </li>
          ))}
        </ul>
      ) : data.items.length === 0 ? (
        <p className="py-12 text-center text-muted">No products match your filters.</p>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {data.total} product{data.total === 1 ? '' : 's'}
          </p>
          <ul className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', isPlaceholderData && 'opacity-60')}>
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)}>
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) }, false)}>
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
