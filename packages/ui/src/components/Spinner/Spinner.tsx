import { cn } from '../../lib/cn';

/** Decorative spinner: pair it with a text/`role="status"` announcement, it is hidden from AT. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={cn('size-5 motion-safe:animate-spin', className)}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" className="opacity-80" />
    </svg>
  );
}
