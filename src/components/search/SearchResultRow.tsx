import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { ExpenseSearchResult } from '@/types/expense';

export function SearchResultRow({ result, emoji, showGroup, onSelect }: {
  result: ExpenseSearchResult; emoji?: string; showGroup: boolean; onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const period = `${monthsShort[result.periodMonth - 1] ?? ''} ${result.periodYear}`;
  const now = new Date();
  const isPast = result.periodYear * 12 + result.periodMonth < now.getFullYear() * 12 + now.getMonth() + 1;
  const meta = [showGroup ? result.groupName : null, t('search.paidBy', { name: result.payerName })]
    .filter(Boolean).join(' · ');
  return (
    <button type="button" onClick={onSelect}
      className="flex w-full cursor-pointer items-start gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-surface-sunken/60">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken text-lg leading-none">
        {emoji ?? '·'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">{result.description}</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-medium text-muted-1">
          {result.kind === 'recurring_personal' ? t('search.everyMonth', { period }) : meta}
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10.5px] font-bold capitalize text-muted-1">{period}</span>
          {result.periodSettled !== null && (
            <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-bold',
              result.periodSettled ? 'bg-positive-wash text-positive'
                : isPast ? 'bg-negative-wash text-negative' : 'bg-surface-sunken text-muted-1')}>
              {result.periodSettled ? t('search.settled') : t('search.unsettled')}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-foreground">
        {formatAmount(result.amount, result.currency)}
      </span>
    </button>
  );
}
