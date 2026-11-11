import { StarIcon } from '../../icons';

export function Rating({ value }: { value: number }) {
  return (
    <span className="text-sm text-muted" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <StarIcon aria-hidden className="mr-0.5 inline size-4 -translate-y-px text-amber-500" />
      {value.toFixed(1)}
    </span>
  );
}
