import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from './cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' };

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-brand-contrast hover:opacity-90',
        variant === 'outline' && 'border border-border bg-surface hover:bg-bg',
        variant === 'ghost' && 'hover:bg-border/50',
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('shop-skeleton rounded-lg bg-border', className)} {...props} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-6 text-center">
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Placeholder product "photo": tinted gradient + emoji, so the demo needs no image hosting. */
export function ProductArt({ emoji, hue, className }: { emoji: string; hue: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('flex aspect-square items-center justify-center text-6xl', className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 85%), hsl(${(hue + 40) % 360} 70% 70%))` }}
    >
      {emoji}
    </div>
  );
}

export function Rating({ value }: { value: number }) {
  return (
    <span className="text-sm text-muted" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span aria-hidden className="text-amber-500">★</span> {value.toFixed(1)}
    </span>
  );
}
