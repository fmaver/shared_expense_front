import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { capitalize, formatDayMonth } from '@/utils/format';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { CategoryWithEmoji, PersonalLedgerResponse } from '@/types/expense';

type MovementKind = 'income' | 'expense' | 'share';

interface Movement {
  key: string;
  kind: MovementKind;
  title: string;
  meta: string;
  date: string;
  amount: number;
  currency?: string;
  emoji?: string;
  fallback: string;
}

/**
 * Todo lo que pasó este mes, en una sola lista y ordenado por fecha.
 *
 * El home personal mostraba tres listas separadas —ingresos, gastos propios y lo de los
 * grupos— y había que sumarlas mentalmente para saber cómo venía el mes. Acá es una sola
 * cronología: lo que entró en verde, lo que salió en tinta (§6.1).
 */
export function MovementsList({
  ledger, categories, limit,
}: {
  ledger: PersonalLedgerResponse;
  categories: CategoryWithEmoji[];
  limit?: number;
}) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  const emojiFor = (category: string) => categories.find(c => c.name === category)?.emoji;

  const movements: Movement[] = [
    ...ledger.incomes.map(i => ({
      key: `inc-${i.id}`,
      kind: 'income' as const,
      title: i.label,
      meta: t('personal.income'),
      // Los ingresos del mes no traen día propio: se anclan al primero para ordenar.
      date: `${i.year}-${String(i.month).padStart(2, '0')}-01`,
      amount: i.amount,
      currency: i.currency,
      fallback: '+',
    })),
    ...ledger.personalExpenses.map(e => ({
      key: `exp-${e.id}`,
      kind: 'expense' as const,
      title: capitalize(e.description),
      meta: capitalize(t(`categories.${e.category}`, { defaultValue: e.category })),
      date: e.date,
      amount: e.amount,
      currency: e.currency,
      emoji: emojiFor(e.category),
      fallback: e.category.slice(0, 2),
    })),
    ...ledger.recurringPersonalExpenses.map(e => ({
      key: `rec-${e.id}`,
      kind: 'expense' as const,
      title: capitalize(e.label),
      meta: t('expenses.badgeFixed'),
      date: `${e.year}-${String(e.month).padStart(2, '0')}-01`,
      amount: e.amount,
      currency: e.currency,
      emoji: emojiFor(e.categoryName),
      fallback: e.categoryName.slice(0, 2),
    })),
    ...ledger.mirroredShares.map(s => ({
      key: `shr-${s.sourceGroupId}-${s.sourceExpenseId}`,
      kind: 'share' as const,
      title: capitalize(s.description),
      meta: s.sourceGroupName,
      date: s.date,
      amount: s.shareAmount,
      emoji: emojiFor(s.category),
      fallback: s.category.slice(0, 2),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const shown = limit ? movements.slice(0, limit) : movements;

  if (shown.length === 0) {
    return <p className="px-5 py-8 text-center text-[12.5px] text-muted-2">{t('personal.noMovements')}</p>;
  }

  return (
    <div>
      {shown.map(m => (
        <div
          key={m.key}
          className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
        >
          <div
            className={cn(
              'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]',
              m.kind === 'income' ? 'bg-positive-wash' : 'bg-surface-sunken',
            )}
          >
            {m.emoji
              ? <span className="text-lg leading-none">{m.emoji}</span>
              : <span className={cn(
                  'text-[11px] font-bold uppercase',
                  m.kind === 'income' ? 'text-positive' : 'text-muted-2',
                )}>{m.fallback}</span>}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
              {m.title}
            </p>
            <p className="mt-0.5 truncate text-[11.5px] font-medium leading-tight text-muted-2">
              {m.meta} · {formatDayMonth(m.date, monthsShort)}
            </p>
          </div>

          <p
            className={cn(
              'shrink-0 text-[13.5px] font-bold tabular-nums',
              m.kind === 'income' ? 'text-positive' : 'text-foreground',
            )}
          >
            {m.kind === 'income' ? '+' : ''}{formatAmount(m.amount, m.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
