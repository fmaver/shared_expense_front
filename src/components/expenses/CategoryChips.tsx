import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { CategoryWithEmoji } from '@/types/expense';

/** Cuántas categorías se ven antes del "+N". */
const VISIBLE = 4;

interface CategoryChipsProps {
  categories: CategoryWithEmoji[];
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Las categorías, con las primeras a la vista y un "+N" para el resto.
 *
 * Antes era una hilera con scroll horizontal: las que no entraban quedaban invisibles, y en un
 * formulario que ya scrollea verticalmente un carrusel adentro se descubre de casualidad. Acá
 * entran las de siempre, el "+N" dice cuántas faltan, y al abrirlo se ven todas envueltas.
 * La elegida está siempre a la vista aunque viva en la segunda mitad.
 */
export function CategoryChips({
  categories, value, onChange, disabled = false, className,
}: CategoryChipsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const selectedIndex = categories.findIndex(c => c.name === value);
  const head = categories.slice(0, VISIBLE);
  // Si la elegida quedó afuera del corte, entra empujando a la última: nunca se pierde de vista.
  if (selectedIndex >= VISIBLE) head[VISIBLE - 1] = categories[selectedIndex];

  const shown = expanded ? categories : head;
  const hidden = categories.length - head.length;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {shown.map(category => (
        <button
          key={category.name}
          type="button"
          disabled={disabled}
          onClick={() => onChange(category.name)}
          className={cn(
            'h-9 cursor-pointer whitespace-nowrap rounded-pill px-3 text-[12px] font-bold transition-colors',
            value === category.name
              ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
              : 'border border-line-strong text-muted-1 hover:bg-surface-sunken',
            disabled && 'cursor-default opacity-60',
          )}
        >
          {category.emoji} {t(`categories.${category.name}`, { defaultValue: category.name })}
        </button>
      ))}

      {!expanded && hidden > 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setExpanded(true)}
          className="h-9 cursor-pointer rounded-pill border border-line-strong px-3 text-[12px] font-bold text-muted-1 transition-colors hover:bg-surface-sunken"
        >
          +{hidden}
        </button>
      )}
    </div>
  );
}
