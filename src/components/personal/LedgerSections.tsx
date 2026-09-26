import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { capitalize, formatCurrency, formatDayMonth } from '@/utils/format';
import { avatarBg, initials } from '@/utils/avatar';
import { useCurrency } from '@/contexts/CurrencyContext';
import type {
  CategoryWithEmoji, MirroredShareItem, PersonalLedgerResponse,
} from '@/types/expense';

/** Cuántas filas entran en el home antes del "ver más". */
const PREVIEW_ROWS = 4;
/** Cuántos gastos se asoman dentro de la tarjeta de un grupo. */
const GROUP_PREVIEW = 3;

interface SectionProps {
  ledger: PersonalLedgerResponse;
  categories: CategoryWithEmoji[];
  year: number;
  month: number;
}

/* ── La cáscara que comparten las tres ──────────────────────────────────────────────── */

function Section({
  dot, title, total, subtitle, children, footer,
}: {
  dot: string;
  title: string;
  total: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="px-5 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-2 font-display text-[19px] leading-none text-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden="true" />
            <span className="truncate">{title}</span>
          </h2>
          <p className="shrink-0 text-[15px] font-bold tabular-nums text-foreground">{total}</p>
        </div>
        <p className="mt-1.5 text-[11.5px] font-medium leading-[1.45] text-muted-2">{subtitle}</p>
      </div>
      <div className="border-t border-line">{children}</div>
      <div className="border-t border-line p-3">{footer}</div>
    </section>
  );
}

/** El botón de ancho completo que abre la lista entera. */
function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex h-10 w-full items-center justify-center rounded-[11px] bg-surface-sunken text-[12.5px] font-bold text-foreground transition-colors hover:bg-line"
    >
      {label}
    </Link>
  );
}

/** Una fila: cuadrado a la izquierda, título con badge, meta abajo, monto a la derecha. */
function Row({
  icon, iconTone = 'sunken', title, badge, meta, amount, amountTone = 'text-foreground',
}: {
  icon: React.ReactNode;
  iconTone?: 'sunken' | 'positive';
  title: string;
  badge?: string;
  meta?: string;
  amount: string;
  amountTone?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0">
      <div className={cn(
        'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]',
        iconTone === 'positive' ? 'bg-positive-wash' : 'bg-surface-sunken',
      )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">{title}</p>
          {badge && (
            <span className="shrink-0 rounded-chip bg-brand-wash px-1.5 py-0.5 text-[10.5px] font-bold leading-[1.4] text-brand-ink">
              {badge}
            </span>
          )}
        </div>
        {meta && (
          <p className="mt-0.5 truncate text-[11.5px] font-medium leading-tight text-muted-2">{meta}</p>
        )}
      </div>
      <p className={cn('shrink-0 text-[13.5px] font-bold tabular-nums', amountTone)}>{amount}</p>
    </div>
  );
}

/* ── 1. Entró ───────────────────────────────────────────────────────────────────────── */

export function IncomeSection({ ledger, year, month }: SectionProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();

  /* El sueldo primero: es el ingreso del que cuelga todo el mes. */
  const incomes = [...ledger.incomes].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'recurring' ? -1 : 1;
    return b.amount - a.amount;
  });

  return (
    <Section
      dot="bg-positive"
      title={t('personal.sectionIn')}
      total={formatCurrency(ledger.totalIncome)}
      subtitle={t('personal.incomeCount', { count: incomes.length })}
      footer={<SeeAll
        to={`/personal/incomes?year=${year}&month=${month}`}
        label={t('personal.seeAllIncomes', { count: incomes.length })}
      />}
    >
      {incomes.length === 0 ? (
        <p className="px-5 py-8 text-center text-[12.5px] text-muted-2">{t('personal.noIncome')}</p>
      ) : incomes.slice(0, PREVIEW_ROWS).map(income => (
        <Row
          key={income.id}
          iconTone="positive"
          icon={<span className="text-[15px] font-bold leading-none text-positive">+</span>}
          title={capitalize(income.label)}
          badge={income.source === 'recurring' ? t('expenses.badgeRecurring2') : undefined}
          meta={income.source === 'variable' ? t('personal.incomeExtra') : undefined}
          amount={`+${formatAmount(income.amount, income.currency)}`}
          amountTone="text-positive"
        />
      ))}
    </Section>
  );
}

/* ── 2. Gastos míos ─────────────────────────────────────────────────────────────────── */

export function OwnExpensesSection({ ledger, categories, year, month }: SectionProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const emojiFor = (category: string) => categories.find(c => c.name === category)?.emoji;

  const fixedTotal = ledger.recurringPersonalExpenses.reduce((s, e) => s + e.amount, 0);
  const count = ledger.recurringPersonalExpenses.length + ledger.personalExpenses.length;

  /* Los fijos arriba: son los que ya están decididos y no se vuelven a pensar cada mes. */
  const rows = [
    ...ledger.recurringPersonalExpenses.map(e => ({
      key: `rec-${e.id}`,
      title: capitalize(e.label),
      badge: t('expenses.badgeFixed').toLocaleLowerCase(),
      meta: capitalize(t(`categories.${e.categoryName}`, { defaultValue: e.categoryName })),
      emoji: emojiFor(e.categoryName),
      fallback: e.categoryName.slice(0, 2),
      amount: formatAmount(e.amount, e.currency),
    })),
    ...[...ledger.personalExpenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(e => ({
        key: `exp-${e.id}`,
        title: capitalize(e.description),
        badge: undefined,
        meta: `${capitalize(t(`categories.${e.category}`, { defaultValue: e.category }))} · ${formatDayMonth(e.date, monthsShort)}`,
        emoji: emojiFor(e.category),
        fallback: e.category.slice(0, 2),
        amount: formatAmount(e.amount, e.currency),
      })),
  ];

  const subtitle = fixedTotal > 0
    ? `${t('personal.expenseCount', { count })} · ${t('personal.expenseFixedPart', { amount: formatCurrency(fixedTotal) })}`
    : t('personal.expenseCount', { count });

  return (
    <Section
      dot="bg-negative"
      title={t('personal.sectionMine')}
      total={formatCurrency(ledger.totalPersonalExpenses)}
      subtitle={subtitle}
      footer={<SeeAll
        to={`/personal/expenses?year=${year}&month=${month}`}
        label={t('personal.seeAllExpenses', { count })}
      />}
    >
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-[12.5px] text-muted-2">{t('personal.noMovements')}</p>
      ) : rows.slice(0, PREVIEW_ROWS).map(row => (
        <Row
          key={row.key}
          icon={row.emoji
            ? <span className="text-lg leading-none">{row.emoji}</span>
            : <span className="text-[11px] font-bold uppercase text-muted-2">{row.fallback}</span>}
          title={row.title}
          badge={row.badge}
          meta={row.meta}
          amount={row.amount}
        />
      ))}
    </Section>
  );
}

/* ── 3. Tu parte en grupos ──────────────────────────────────────────────────────────── */

export function GroupSharesSection({ ledger, categories, year, month }: SectionProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const emojiFor = (category: string) => categories.find(c => c.name === category)?.emoji;

  const total = ledger.mirroredShares.reduce((s, sh) => s + sh.shareAmount, 0);

  /* Un bloque por grupo: la parte que te tocó ahí, y cómo quedás con ese grupo. */
  const byGroup = (() => {
    const map = new Map<number, { id: number; name: string; shares: MirroredShareItem[] }>();
    for (const share of ledger.mirroredShares) {
      const entry = map.get(share.sourceGroupId)
        ?? { id: share.sourceGroupId, name: share.sourceGroupName, shares: [] };
      entry.shares.push(share);
      map.set(share.sourceGroupId, entry);
    }
    return [...map.values()].map(g => ({
      ...g,
      total: g.shares.reduce((s, sh) => s + sh.shareAmount, 0),
      balance: ledger.groupBalances.find(b => b.sourceGroupId === g.id)?.netBalance ?? 0,
    })).sort((a, b) => b.total - a.total);
  })();

  /* "2 grupos · $145.000 a favor en Casa, $75.000 a pagar en Bariloche" */
  const subtitle = (() => {
    const head = t('personal.groupCount', { count: byGroup.length });
    const open = ledger.groupBalances
      .filter(b => !b.isSettled && Math.abs(b.netBalance) > 0.01)
      .map(b => t(b.netBalance > 0 ? 'personal.groupFavour' : 'personal.groupOwed', {
        amount: formatCurrency(Math.abs(b.netBalance)),
        group: b.sourceGroupName,
      }));
    return open.length > 0 ? `${head} · ${open.join(', ')}` : head;
  })();

  return (
    <Section
      dot="bg-brand"
      title={t('personal.sectionGroups')}
      total={formatCurrency(total)}
      subtitle={subtitle}
      footer={<SeeAll
        to={`/personal/shares?year=${year}&month=${month}`}
        label={t('personal.seeAllShares')}
      />}
    >
      {byGroup.length === 0 ? (
        <p className="px-5 py-8 text-center text-[12.5px] text-muted-2">{t('personal.noShares')}</p>
      ) : byGroup.map(group => {
        const rest = group.shares.length - GROUP_PREVIEW;
        const square = Math.abs(group.balance) <= 0.01;
        return (
          <div key={group.id} className="border-b border-line px-5 py-4 last:border-b-0">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                'flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-[10px] text-[11px] font-bold text-white',
                avatarBg(group.id),
              )}>
                {initials(group.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold leading-tight text-foreground">{group.name}</p>
                <p className="mt-0.5 text-[11.5px] font-medium leading-tight text-muted-2">
                  {t('personal.expenseCount', { count: group.shares.length })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13.5px] font-bold leading-tight tabular-nums text-foreground">
                  {formatCurrency(group.total)}
                </p>
                {!square && (
                  <p className={cn(
                    'mt-0.5 text-[11.5px] font-semibold leading-tight tabular-nums',
                    group.balance > 0 ? 'text-positive' : 'text-negative',
                  )}>
                    {group.balance > 0 ? '+' : '−'}{formatCurrency(Math.abs(group.balance))}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              {group.shares.slice(0, GROUP_PREVIEW).map(share => (
                <div
                  key={`${share.sourceExpenseId}-${share.installmentNo}`}
                  className="flex items-center gap-2"
                >
                  <span className="w-4 shrink-0 text-center text-[12px] leading-none">
                    {emojiFor(share.category) ?? '·'}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-muted-1">
                    {capitalize(share.description)}
                  </p>
                  <p className="shrink-0 text-[12px] font-semibold tabular-nums text-muted-1">
                    {formatAmount(share.shareAmount, 'ARS')}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span className="text-[11.5px] font-medium text-muted-2">
                {rest > 0 ? t('personal.andMore', { count: rest }) : ''}
              </span>
              <Link
                to={`/groups/${group.id}?year=${year}&month=${month}`}
                className="shrink-0 text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70"
              >
                {t('personal.seeGroup', { group: group.name })}
              </Link>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
