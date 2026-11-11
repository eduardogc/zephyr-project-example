import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { api } from '@shop/api-client';
import { categorySchema, productQuerySchema } from '@shop/types';
import { Button, ChevronLeftIcon, ChevronRightIcon, ErrorState, Skeleton, XMarkIcon, cn } from '@shop/ui';
import { FilterMenu } from './FilterMenu';
import { ProductCard } from './ProductCard';
import { SearchBar } from './SearchBar';
import { useDebounced } from './useDebounced';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6';

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

      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterMenu
          category={category}
          sort={sort}
          onCategory={(c) => update({ category: c })}
          onSort={(s) => update({ sort: s === 'featured' ? undefined : s })}
        />
      </div>

      {category && (
        <p className="flex items-center gap-2 text-sm">
          <span className="text-muted">Category:</span>
          <button
            type="button"
            onClick={() => update({ category: undefined })}
            aria-label={`Remove category filter ${category}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 font-medium capitalize text-brand hover:bg-brand/20"
          >
            {category}
            <XMarkIcon aria-hidden className="size-4" />
          </button>
        </p>
      )}

      {isError ? (
        <ErrorState message="We couldn't load the products." onRetry={() => refetch()} />
      ) : isPending ? (
        <ul className={GRID} aria-busy="true" aria-label="Loading products">
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
          <ul className={cn(GRID, isPlaceholderData && 'opacity-60')}>
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)}>
                <ChevronLeftIcon aria-hidden className="size-4" /> Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) }, false)}>
                Next <ChevronRightIcon aria-hidden className="size-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
