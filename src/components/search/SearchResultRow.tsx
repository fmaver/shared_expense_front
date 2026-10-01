import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { highlightParts } from '@/utils/search';
import { GroupChip } from '@/components/search/GroupChip';
import type { ExpenseSearchResult } from '@/types/expense';

/** Emoji de categoría cuando no hay uno conocido — nunca "·" ni iniciales. */
export const FALLBACK_EMOJI = '🧾';

/** Resalta las coincidencias de `query` dentro de `text` (ver `highlightParts`). */
export function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, i) => (
        <Fragment key={i}>
          {part.match ? (
            <mark className="rounded-[3px] bg-brand-wash-line text-inherit">{part.text}</mark>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Fila de resultado V8 (ADDENDUM-violeta.md, "Ajuste V8"): emoji de categoría, título
 * resaltado, chip de grupo (sólo en `scope: 'all'`) + "pagó X" (o "tuyo" en personal), y a
 * la derecha el monto con el estado en texto debajo, sin pastilla. Sin chip de mes: el
 * encabezado del día ya lo dice.
 */
export function SearchResultRow({ result, emoji, query, scope, archived, onSelect }: {
  result: ExpenseSearchResult;
  emoji?: string;
  query: string;
  scope: 'all' | 'group';
  archived: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const isRecurringPersonal = result.kind === 'recurring_personal';
  const isPersonal = result.groupType === 'personal';

  let status: { text: string; className: string } | null = null;
  if (!isRecurringPersonal && result.periodSettled !== null) {
    if (result.periodSettled) {
      status = result.yourShare !== null && result.yourShare > 0
        ? { text: t('search.yourShare', { amount: formatAmount(result.yourShare, result.currency) }), className: 'text-muted-1' }
        : { text: t('search.settled'), className: 'text-positive' };
    } else {
      status = { text: t('search.unsettled'), className: 'text-negative' };
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full cursor-pointer items-start gap-3 border-b border-line-soft px-4 py-3 text-left last:border-b-0 hover:bg-surface-sunken/60"
    >
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken text-lg leading-none">
        {emoji ?? FALLBACK_EMOJI}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">
          <Highlighted text={result.description} query={query} />
        </span>
        <span className="mt-[5px] flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-muted-2">
          {isRecurringPersonal ? (
            <span>{t('search.everyMonth')}</span>
          ) : (
            <>
              {scope === 'all' && (
                <GroupChip name={result.groupName} groupId={result.groupId} groupType={result.groupType} archived={archived} />
              )}
              <span className="truncate">
                {scope === 'all' && '· '}
                {isPersonal ? t('search.yours') : <>{t('search.paidBy')} <Highlighted text={result.payerName} query={query} /></>}
              </span>
            </>
          )}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[13.5px] font-bold tabular-nums text-foreground">
          {formatAmount(result.amount, result.currency)}
        </span>
        {status && (
          <span className={`mt-1 block text-[10.5px] font-semibold ${status.className}`}>{status.text}</span>
        )}
      </span>
    </button>
  );
}
