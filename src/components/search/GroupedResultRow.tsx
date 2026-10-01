import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { FALLBACK_EMOJI } from '@/components/search/SearchResultRow';
import type { ExpenseSearchResult } from '@/types/expense';

/**
 * Cáscara compartida de las filas que agrupan varios resultados en uno (cuotas de una compra,
 * meses de un recurrente): emoji, título, subtítulo, un extra opcional (la barra de avance de
 * las cuotas), el botón "Ver los N…" que despliega la lista ahí mismo, y a la derecha el monto
 * con su estado. Cada ítem de la lista es "mes año" + su estado y abre ese resultado.
 */
export function GroupedResultRow({
  emoji, title, subtitle, extra, toggleLabel, aside, items, tabIndex = 0, onOpen, onSelect,
}: {
  emoji?: string;
  title: ReactNode;
  subtitle: ReactNode;
  extra?: ReactNode;
  toggleLabel: string;
  aside: ReactNode;
  items: ExpenseSearchResult[];
  /** -1 mientras el overlay está cerrado, para que el tab no entre en filas invisibles. */
  tabIndex?: number;
  onOpen: () => void;
  onSelect: (item: ExpenseSearchResult) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  return (
    <div className="border-b border-line-soft px-4 py-3 last:border-b-0">
      {/* `div[role=button]`, no `<button>`: adentro hay un botón propio ("Ver los N…") y un
          `<button>` no puede anidar contenido interactivo. */}
      <div
        role="button"
        tabIndex={tabIndex}
        onClick={onOpen}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
        className="flex w-full cursor-pointer items-start gap-3 text-left"
      >
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken text-lg leading-none">
          {emoji ?? FALLBACK_EMOJI}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-foreground">{title}</span>
          <span className="mt-[3px] flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] font-medium text-muted-2">
            {subtitle}
          </span>
          {extra}
          <button
            type="button"
            tabIndex={tabIndex}
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            aria-expanded={expanded}
            className="mt-[7px] flex cursor-pointer items-center gap-1 text-[11.5px] font-bold text-brand-ink"
          >
            {toggleLabel}
            {expanded ? <ChevronUp className="h-3 w-3" strokeWidth={2.6} /> : <ChevronDown className="h-3 w-3" strokeWidth={2.6} />}
          </button>
        </span>
        <span className="shrink-0 self-start text-right">{aside}</span>
      </div>
      {expanded && (
        <ul className="mt-2 min-w-0 divide-y divide-line-soft border-t border-line-soft pl-[50px]">
          {items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                tabIndex={tabIndex}
                onClick={() => onSelect(item)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 py-2 text-left text-[12px] font-medium text-muted-2 hover:text-foreground"
              >
                <span className="truncate">{monthsShort[item.periodMonth - 1] ?? ''} {item.periodYear}</span>
                {item.periodSettled !== null && (
                  <span className={cn('shrink-0 text-[10.5px] font-semibold', item.periodSettled ? 'text-positive' : 'text-negative')}>
                    {item.periodSettled ? t('search.settled') : t('search.unsettled')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Estado de un grupo de resultados: "K sin saldar" en rojo, "saldado" en verde, o nada (personal). */
export function GroupedStatus({ items }: { items: ExpenseSearchResult[] }) {
  const { t } = useTranslation();
  // `periodSettled` es siempre null para el grupo personal (no tiene saldado).
  if (!items.some(item => item.periodSettled !== null)) return null;
  const unsettled = items.filter(item => item.periodSettled === false).length;
  return (
    <span className={cn('mt-1 block text-[10.5px] font-semibold', unsettled === 0 ? 'text-positive' : 'text-negative')}>
      {unsettled === 0 ? t('search.settled') : t('search.installmentsUnsettled', { count: unsettled })}
    </span>
  );
}
