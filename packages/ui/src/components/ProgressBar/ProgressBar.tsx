import { cn } from '../../lib/cn';

/** Thin indeterminate bar. Reserves its height when idle so the layout does not jump. */
export function ProgressBar({ active, className }: { active: boolean; className?: string }) {
  return <div aria-hidden className={cn('shop-progress transition-opacity', active ? 'opacity-100' : 'opacity-0', className)} />;
}
