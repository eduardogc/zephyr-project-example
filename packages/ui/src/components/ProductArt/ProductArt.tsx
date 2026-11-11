import { cn } from '../../lib/cn';

/** Placeholder product "photo": tinted gradient + emoji, used when a product has no real photo. */
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
