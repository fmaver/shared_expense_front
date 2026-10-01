import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { baseDescription, type Purchase } from '@/utils/search';
import { GroupChip } from '@/components/search/GroupChip';
import { Highlighted } from '@/components/search/SearchResultRow';
import { GroupedResultRow, GroupedStatus } from '@/components/search/GroupedResultRow';
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

  const { first, items } = purchase;
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  // Personal no tiene saldado (periodSettled null): sin barra de avance.
  const hasStatus = items.some(item => item.periodSettled !== null);
  const paid = items.filter(item => item.periodSettled === true).length;

  return (
    <GroupedResultRow
      emoji={emoji}
      title={<Highlighted text={baseDescription(first.description)} query={query} />}
      subtitle={(
        <>
          {scope === 'all' && (
            <GroupChip name={first.groupName} groupId={first.groupId} groupType={first.groupType} archived={archived} />
          )}
          <span className="min-w-0 truncate">
            {scope === 'all' && '· '}
            {t('search.paidBy')} <Highlighted text={first.payerName} query={query} />
            {' · '}
            {t('search.installmentsOf', { count: first.installments, amount: formatAmount(first.amount, first.currency) })}
          </span>
        </>
      )}
      extra={hasStatus && (
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
      toggleLabel={t('search.viewInstallments', { count: first.installments })}
      aside={(
        <>
          <span className="block text-[13.5px] font-bold tabular-nums text-foreground">{formatAmount(total, first.currency)}</span>
          <GroupedStatus items={items} />
        </>
      )}
      items={items}
      tabIndex={tabIndex}
      onOpen={() => onSelect(first)}
      onSelect={onSelect}
    />
  );
}
