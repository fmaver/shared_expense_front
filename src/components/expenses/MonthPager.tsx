import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface MonthPagerProps {
  year: number;
  month: number; // 1–12
  onNavigate: (year: number, month: number) => void;
  /** Un punto al lado del mes cuando ya está saldado (§6.6: cerrar un mes no congela el grupo). */
  isSettled?: boolean;
  className?: string;
}

/**
 * Paginador de mes.
 *
 * El mes es el alcance de la pantalla, no un filtro más (principio 3), así que manda arriba de
 * la lista y lo comparten Gastos, Gente y Números. Se puede avanzar al futuro a propósito: un
 * gasto en cuotas o una expensa a crédito caen en meses que todavía no llegaron, y hay que
 * poder ir a verlos.
 */
export function MonthPager({ year, month, onNavigate, isSettled = false, className }: MonthPagerProps) {
  const { t } = useTranslation();
  const months = t('months', { returnObjects: true }) as string[];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();

  useEffect(() => { setPickerYear(year); }, [year, pickerOpen]);

  // Cerrar al tocar afuera: el selector es un panel flotante, no un diálogo.
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pickerOpen]);

  const prev = () => (month === 1 ? onNavigate(year - 1, 12) : onNavigate(year, month - 1));
  const next = () => (month === 12 ? onNavigate(year + 1, 1) : onNavigate(year, month + 1));

  const arrow = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors';

  return (
    <div ref={containerRef} className={cn('relative flex items-center justify-center gap-2', className)}>
      <button
        type="button"
        onClick={prev}
        aria-label={t('monthPager.previous')}
        className={cn(arrow, 'cursor-pointer border-line-strong text-foreground hover:bg-surface-sunken')}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setPickerOpen(o => !o)}
        aria-label={t('monthPager.pick')}
        aria-expanded={pickerOpen}
        className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border border-line-strong bg-surface px-4 text-[13.5px] font-bold text-foreground transition-colors hover:bg-surface-sunken"
      >
        {isSettled && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-positive" aria-hidden="true" />
        )}
        <span className="tabular-nums">{months[month - 1]} {year}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-2 transition-transform', pickerOpen && 'rotate-180')} />
      </button>

      <button
        type="button"
        onClick={next}
        aria-label={t('monthPager.next')}
        className={cn(arrow, 'cursor-pointer border-line-strong text-foreground hover:bg-surface-sunken')}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {pickerOpen && (
        <div className="absolute left-1/2 top-10 z-40 w-64 -translate-x-1/2 rounded-card border border-line bg-surface p-3 shadow-panel">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerYear(y => y - 1)}
              aria-label={String(pickerYear - 1)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-1 hover:bg-surface-sunken"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-bold tabular-nums text-foreground">{pickerYear}</span>
            <button
              type="button"
              onClick={() => setPickerYear(y => y + 1)}
              aria-label={String(pickerYear + 1)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-1 hover:bg-surface-sunken"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((name, i) => {
              const isActive = pickerYear === year && i + 1 === month;
              // El mes de hoy se marca, pero los de adelante siguen siendo navegables.
              const isToday = pickerYear === today.getFullYear() && i === today.getMonth();
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onNavigate(pickerYear, i + 1); setPickerOpen(false); }}
                  className={cn(
                    'h-8 cursor-pointer rounded-chip text-[12px] font-semibold capitalize transition-colors',
                    isActive
                      ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                      : isToday
                        ? 'text-brand-ink hover:bg-surface-sunken'
                        : 'text-foreground hover:bg-surface-sunken',
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
