import { useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, Spinner, XMarkIcon } from '@shop/ui';

type Props = { value: string; onChange: (value: string) => void; loading?: boolean };

export function SearchBar({ value, onChange, loading = false }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  // "/" focuses the search box (unless you're already typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== '/' || el.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative min-w-0 flex-1">
      {loading ? (
        <Spinner className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand" />
      ) : (
        <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
      )}
      <input
        ref={ref}
        aria-keyshortcuts="/"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && value && onChange('')}
        placeholder="Search products…"
        aria-label="Search products"
        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-11 pr-11 text-sm shadow-sm placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-border/60 hover:text-text focus-visible:outline-2 focus-visible:outline-brand"
        >
          <XMarkIcon aria-hidden className="size-4" />
        </button>
      ) : (
        <kbd aria-hidden className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-xs text-muted md:block">
          /
        </kbd>
      )}
    </div>
  );
}
