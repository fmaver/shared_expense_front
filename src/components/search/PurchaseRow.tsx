import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { baseDescription, type Purchase } from '@/utils/search';
import { GroupChip } from '@/components/search/GroupChip';
import { Highlighted, FALLBACK_EMOJI } from '@/components/search/SearchResultRow';
import type { ExpenseSearchResult } from '@/types/expense';

/**
 * Fila de una compra en cuotas (V8.b "Cuotas agrupadas"): una sola fila para toda la
 * compra, con el total, "N cuotas de $Y", una barra de avance y "Ver las N cuotas" que
 * despliega la lista de cuotas ahí mismo. El conteo de resultados cuenta compras, no cuotas.
 */
export function PurchaseRow({ purchase, emoji, query, scope, archived, tabIndex = 0, onSelect }: {
  purchase: Purchase;
  emoji?: string;
  query: string;
  scope: 'all' | 'group';
  archived: boolean;
  /** -1 mientras el overlay está cerrado, para que el tab no entre en filas invisibles. */
  tabIndex?: number;
  onSelect: (item: ExpenseSearchResult) => void;
}) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  const { first, items } = purchase;
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  // `periodSettled` es siempre null para el grupo personal (no tiene saldado) — en ese caso
  // no hay estado ni barra de avance que mostrar, sólo el total y las cuotas.
  const hasStatus = items.some(item => item.periodSettled !== null);
  const paid = items.filter(item => item.periodSettled === true).length;
  const unsettled = items.filter(item => item.periodSettled === false).length;
  const allSettled = hasStatus && unsettled === 0;

  const openFirst = () => onSelect(first);

  return (
    <div className="border-b border-line-soft px-4 py-3 last:border-b-0">
      {/* `div[role=button]`, no `<button>`: adentro hay un botón propio ("Ver las N cuotas") y
          un `<button>` no puede anidar contenido interactivo. */}
      <div
        role="button"
        tabIndex={tabIndex}
        onClick={openFirst}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFirst(); } }}
        className="flex w-full cursor-pointer items-start gap-3 text-left"
      >
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken text-lg leading-none">
          {emoji ?? FALLBACK_EMOJI}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-foreground">
            <Highlighted text={baseDescription(first.description)} query={query} />
          </span>
          <span className="mt-[3px] flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] font-medium text-muted-2">
            {scope === 'all' && (
              <GroupChip name={first.groupName} groupId={first.groupId} groupType={first.groupType} archived={archived} />
            )}
            <span className="min-w-0 truncate">
              {scope === 'all' && '· '}
              {t('search.paidBy')} <Highlighted text={first.payerName} query={query} />
              {' · '}
              {t('search.installmentsOf', { count: first.installments, amount: formatAmount(first.amount, first.currency) })}
            </span>
          </span>
          {hasStatus && (
            <span className="mt-2 flex items-center gap-2">
              <span className="block h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${items.length ? (paid / items.length) * 100 : 0}%` }}
                />
              </span>
              <span className="shrink-0 text-[10.5px] font-bold tabular-nums text-[#4A3C96] dark:text-brand-ink">
                {paid}/{items.length}
              </span>
            </span>
          )}
          <button
            type="button"
            tabIndex={tabIndex}
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            className="mt-[7px] flex cursor-pointer items-center gap-1 text-[11.5px] font-bold text-brand-ink"
          >
            {t('search.viewInstallments', { count: first.installments })}
            {expanded ? <ChevronUp className="h-3 w-3" strokeWidth={2.6} /> : <ChevronDown className="h-3 w-3" strokeWidth={2.6} />}
          </button>
        </span>
        <span className="shrink-0 self-start text-right">
          <span className="block text-[13.5px] font-bold tabular-nums text-foreground">{formatAmount(total, first.currency)}</span>
          {hasStatus && (
            <span className={cn('mt-1 block text-[10.5px] font-semibold', allSettled ? 'text-positive' : 'text-negative')}>
              {allSettled ? t('search.settled') : t('search.installmentsUnsettled', { count: unsettled })}
            </span>
          )}
        </span>
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
