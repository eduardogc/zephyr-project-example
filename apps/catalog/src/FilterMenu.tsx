import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { CATEGORIES, SORTS, type Category } from '@shop/types';
import { AdjustmentsHorizontalIcon, Button, cn } from '@shop/ui';

export type Sort = (typeof SORTS)[number];

const SORT_LABELS: Record<Sort, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
};

type Props = {
  category: Category | undefined;
  sort: Sort;
  onCategory: (c: Category | undefined) => void;
  onSort: (s: Sort) => void;
  /** Clears every filter in ONE update (two back-to-back URL updates would overwrite each other). */
  onClear: () => void;
};

function RadioRow({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm capitalize hover:bg-border/50', checked && 'font-medium')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4 accent-[var(--brand)]" />
      {label}
    </label>
  );
}

/** Icon button that opens a dropdown with category + sort. Changes apply immediately. */
export function FilterMenu({ category, sort, onCategory, onSort, onClear }: Props) {
  const activeCount = (category ? 1 : 0) + (sort !== 'featured' ? 1 : 0);

  return (
    <Popover className="relative">
      <PopoverButton
        aria-label={activeCount ? `Filters, ${activeCount} active` : 'Filters'}
        className="relative flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium shadow-sm hover:bg-bg focus-visible:outline-2 focus-visible:outline-brand data-open:border-brand"
      >
        <AdjustmentsHorizontalIcon aria-hidden className="size-5" />
        <span className="hidden sm:inline">Filters</span>
        {activeCount > 0 && (
          <span aria-hidden className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-xs text-brand-contrast">
            {activeCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel className="absolute right-0 z-20 mt-2 w-72 space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xl">
        <fieldset>
          <legend className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted">Category</legend>
          <RadioRow name="category" label="All" checked={!category} onChange={() => onCategory(undefined)} />
          {CATEGORIES.map((c) => (
            <RadioRow key={c} name="category" label={c} checked={category === c} onChange={() => onCategory(c)} />
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted">Sort by</legend>
          {SORTS.map((s) => (
            <RadioRow key={s} name="sort" label={SORT_LABELS[s]} checked={sort === s} onChange={() => onSort(s)} />
          ))}
        </fieldset>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClear}
          >
            Clear filters
          </Button>
        )}
      </PopoverPanel>
    </Popover>
  );
}
