import { cn } from '@/lib/utils';

export interface CategoryBarItem {
  name: string;
  value: number;
  emoji?: string;
}

interface CategoryBarListProps {
  /** Unsorted items; the component sorts desc and drops non-positive values. */
  items: CategoryBarItem[];
  formatValue: (value: number) => string;
  className?: string;
}

/**
 * Horizontal "share of spending" list — one thin bar per category, widths
 * relative to the largest category. Returns null when there is nothing to
 * show so callers can render their own empty state.
 */
export function CategoryBarList({ items, formatValue, className }: CategoryBarListProps) {
  const sorted = [...items].filter(i => i.value > 0).sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value ?? 0;
  if (max <= 0) return null;

  return (
    <div className={cn('space-y-2.5', className)}>
      {sorted.map(item => (
        <div key={item.name}>
          <div className="flex items-baseline justify-between gap-2 text-xs mb-1">
            <span className="text-foreground font-medium truncate">
              {item.emoji ? `${item.emoji} ` : ''}
              {item.name}
            </span>
            <span className="text-muted-foreground tabular-nums shrink-0">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
