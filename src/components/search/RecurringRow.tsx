import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Purchase } from '@/utils/search';
import { GroupChip } from '@/components/search/GroupChip';
import { Highlighted } from '@/components/search/SearchResultRow';
import { GroupedResultRow, GroupedStatus } from '@/components/search/GroupedResultRow';
import type { ExpenseSearchResult } from '@/types/expense';

/**
 * Fila de un gasto recurrente (del grupo o fijo personal) con varios meses encontrados: una
 * sola fila con el monto mensual, "cada mes · N meses" y "Ver los N meses" que despliega cada
 * mes con su estado. Como las cuotas, cuenta una vez en los conteos.
 */
export function RecurringRow({ purchase, emoji, query, scope, archived, tabIndex = 0, onSelect }: {
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
  const isPersonal = first.groupType === 'personal';

  return (
    <GroupedResultRow
      emoji={emoji}
      title={<Highlighted text={first.description} query={query} />}
      subtitle={(
        <>
          {scope === 'all' && (
            <GroupChip name={first.groupName} groupId={first.groupId} groupType={first.groupType} archived={archived} />
          )}
          <span className="min-w-0 truncate">
            {scope === 'all' && '· '}
            {isPersonal ? t('search.yours') : <>{t('search.paidBy')} <Highlighted text={first.payerName} query={query} /></>}
          </span>
          {/* Aparte y sin cortar: si no entra, baja de línea en vez de perder "N meses". */}
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
            ·
            <Repeat className="h-2.5 w-2.5" strokeWidth={2.6} aria-hidden="true" />
            {t('search.everyMonthCount', { count: items.length })}
          </span>
        </>
      )}
      toggleLabel={t('search.viewMonths', { count: items.length })}
      aside={(
        <>
          <span className="block text-[13.5px] font-bold tabular-nums text-foreground">
            {formatAmount(first.amount, first.currency)}
            <span className="ml-0.5 text-[10.5px] font-semibold text-muted-2">{t('search.perMonth')}</span>
          </span>
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
