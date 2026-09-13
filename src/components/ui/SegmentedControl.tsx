import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Tres o cuatro opciones excluyentes, todas a la vista.
 *
 * Se usa donde el `Select` escondía la respuesta detrás de un toque: el canal de aviso y el
 * tema son decisiones de dos segundos y las opciones entran en una línea.
 */
export function SegmentedControl<T extends string>({
  value, options, onChange, className, 'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex gap-1 rounded-pill bg-surface-sunken p-1', className)}
    >
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 flex-1 cursor-pointer rounded-pill text-[12.5px] font-bold transition-colors',
              active
                ? 'bg-surface text-foreground shadow-card dark:bg-paper dark:text-ink'
                : 'text-muted-1 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
