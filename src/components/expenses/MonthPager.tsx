import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getUnsettledMonths } from '@/api/shares';
import type { UnsettledMonth } from '@/types/expense';

interface MonthPagerProps {
  year: number;
  month: number; // 1–12
  onNavigate: (year: number, month: number) => void;
  /** Un punto al lado del mes cuando ya está saldado (§6.6: cerrar un mes no congela el grupo). */
  isSettled?: boolean;
  /** Grupo regular: habilita el atajo "Sin saldar" en el panel. Los grupos one-time/personales no lo pasan. */
  groupId?: number;
  className?: string;
}

/**
 * Paginador de mes, como cápsula de vidrio centrada.
 *
 * El mes es el alcance de la pantalla, no un filtro más (principio 3), así que manda arriba de
 * la lista y lo comparten Gastos, Gente y Números. Se puede avanzar al futuro a propósito: un
 * gasto en cuotas o una expensa a crédito caen en meses que todavía no llegaron, y hay que
 * poder ir a verlos.
 */
export function MonthPager({ year, month, onNavigate, isSettled = false, groupId, className }: MonthPagerProps) {
  const { t } = useTranslation();
  const months = t('months', { returnObjects: true }) as string[];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();

  useEffect(() => { setPickerYear(year); }, [year, pickerOpen]);

  // Meses pasados sin saldar (§ atajo): solo se pide cuando el panel está abierto y hay grupo.
  const [unsettled, setUnsettled] = useState<UnsettledMonth[]>([]);
  useEffect(() => {
    if (!pickerOpen || groupId === undefined) return;
    let cancelled = false;
    getUnsettledMonths(groupId).then(list => { if (!cancelled) setUnsettled(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [pickerOpen, groupId]);
  const isUnsettled = (y: number, m: number) => unsettled.some(u => u.year === y && u.month === m);

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

  const arrow = cn(
    'flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full',
    'text-foreground transition-colors hover:bg-surface-sunken/70',
    "relative before:absolute before:-inset-1.5 before:content-['']",
  );

  return (
    <div ref={containerRef} className={cn('relative flex justify-center', className)}>
      {/* Una sola cápsula de vidrio: ‹ Julio 2026 ▼ › (V6.4). */}
      <div className="glass flex h-9 items-center gap-0.5 rounded-full px-[3px]">
        <button type="button" onClick={prev} aria-label={t('monthPager.previous')} className={arrow}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(o => !o)}
          aria-label={t('monthPager.pick')}
          aria-expanded={pickerOpen}
          className="flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-surface-sunken/70"
        >
          {isSettled && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-positive" aria-hidden="true" />
          )}
          <span className="whitespace-nowrap tabular-nums">{months[month - 1]} {year}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-1 transition-transform', pickerOpen && 'rotate-180')} />
        </button>

        {/* Siempre habilitada: las cuotas y los fijos ya viven en los meses que vienen. */}
        <button type="button" onClick={next} aria-label={t('monthPager.next')} className={arrow}>
          <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>

      {pickerOpen && (
        <div className="absolute left-1/2 top-11 z-40 w-64 -translate-x-1/2 rounded-card border border-line bg-surface p-3 shadow-panel">
          {unsettled.length > 0 && (
            <div className="mb-2.5 border-b border-line pb-2.5">
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-negative">{t('monthPager.unsettled')}</p>
              <div className="flex flex-wrap gap-1.5">
                {unsettled.map(u => (
                  <button
                    key={`${u.year}-${u.month}`}
                    type="button"
                    onClick={() => { onNavigate(u.year, u.month); setPickerOpen(false); }}
                    className="h-7 cursor-pointer rounded-full bg-negative-wash px-2.5 text-[11.5px] font-bold capitalize text-negative"
                  >
                    {`${(months[u.month - 1] ?? '').slice(0, 3)} ${u.year}`}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              const unsettledMonth = isUnsettled(pickerYear, i + 1);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onNavigate(pickerYear, i + 1); setPickerOpen(false); }}
                  aria-label={unsettledMonth ? `${name} ${pickerYear}, ${t('monthPager.unsettledMonth')}` : undefined}
                  className={cn(
                    'h-8 cursor-pointer rounded-chip text-[12px] font-semibold capitalize transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isToday
                        ? 'text-brand-ink hover:bg-surface-sunken'
                        : 'text-foreground hover:bg-surface-sunken',
                  )}
                >
                  {name.slice(0, 3)}
                  {unsettledMonth && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-negative align-middle" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
