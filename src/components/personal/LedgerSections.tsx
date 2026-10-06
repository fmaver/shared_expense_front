import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { capitalize, formatCurrency, formatDayMonth } from '@/utils/format';
import { avatarBg, initials } from '@/utils/avatar';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal';
import { ShowMoreButton } from './ShowMoreButton';
import { baseDescription } from '@/utils/search';
import { ledgerRate, sumArs, toArs } from '@/utils/ledgerMoney';
import type {
  CategoryWithEmoji, MirroredShareItem, PersonalLedgerResponse,
} from '@/types/expense';

/** Cuántas filas de cada sublista se ven antes del "Ver N más". */
const SUBLIST_PREVIEW = 2;
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
          <h2 className="flex min-w-0 items-center gap-2 text-[18px] font-bold leading-none tracking-[-0.025em] text-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden="true" />
            <span className="truncate">{title}</span>
          </h2>
          <p className="shrink-0 text-[15px] font-bold tabular-nums text-foreground">{total}</p>
        </div>
        <p className="mt-1.5 text-[11px] font-medium leading-[1.45] text-muted-1">{subtitle}</p>
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

/**
 * Una fila: cuadrado a la izquierda, título y meta, monto a la derecha.
 *
 * Con `to` es un `Link`: mismo salto que "Ver el grupo" más abajo, a un deep link que ya sabe
 * abrir (`/personal/expenses` y `/groups/:id` resuelven `?expense=`/`?recurring=` solos). Sin
 * `to` queda como antes — la fila de un ingreso, que todavía no tiene detalle propio.
 */
function Row({
  icon, iconTone = 'sunken', title, meta, amount, amountTone = 'text-foreground', to,
}: {
  icon: React.ReactNode;
  iconTone?: 'sunken' | 'positive';
  title: string;
  meta?: string;
  amount: string;
  amountTone?: string;
  to?: string;
}) {
  const className = cn(
    'flex items-center gap-3 border-b border-line px-5 py-[11px] last:border-b-0',
    to && 'cursor-pointer touch-manipulation transition-colors [@media(hover:hover)]:hover:bg-brand-wash active:bg-brand-wash',
  );
  const content = (
    <>
      <div className={cn(
        'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]',
        iconTone === 'positive' ? 'bg-positive-wash' : 'bg-surface-sunken',
      )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">{title}</p>
        {meta && (
          <p className="mt-0.5 truncate text-[11.5px] font-medium leading-tight text-muted-1">{meta}</p>
        )}
      </div>
      <p className={cn('shrink-0 text-[13.5px] font-bold tabular-nums', amountTone)}>{amount}</p>
    </>
  );
  if (to) return <Link to={to} className={className}>{content}</Link>;
  return <div className={className}>{content}</div>;
}

/**
 * "CADA MES" o "CON FECHA": el rótulo con su subtotal y las primeras filas. El resto se
 * despliega acá mismo con "Ver N más", sin navegar, y sólo si hay más de dos. El rótulo ya
 * dice si es fijo, así que las filas no llevan pastilla.
 */
function SubList({ label, total, rows }: { label: string; total: string; rows: React.ReactNode[] }) {
  const { visibleCount, hasMore, remaining, showAll } = useProgressiveReveal(SUBLIST_PREVIEW, rows.length);
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 px-5 pb-0.5 pt-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-1">
        <span>{label}</span>
        <span className="tracking-normal tabular-nums">{total}</span>
      </div>
      <div>{rows.slice(0, visibleCount)}</div>
      {hasMore && <ShowMoreButton remaining={remaining} onClick={showAll} className="px-5 pb-3" />}
    </div>
  );
}

/* ── 1. Entró ───────────────────────────────────────────────────────────────────────── */

export function IncomeSection({ ledger, year, month }: SectionProps) {
  const { t } = useTranslation();
  const { formatAmount, blueRate } = useCurrency();
  const rate = ledgerRate(ledger, blueRate);

  type Money = { amount: number; currency?: string };
  const byAmount = (a: Money, b: Money) => toArs(b.amount, b.currency, rate) - toArs(a.amount, a.currency, rate);
  const recurring = ledger.incomes.filter(i => i.source === 'recurring').sort(byAmount);
  const dated = ledger.incomes.filter(i => i.source !== 'recurring').sort(byAmount);
  const count = recurring.length + dated.length;

  const row = (income: (typeof recurring)[number]) => (
    <Row
      key={income.id}
      iconTone="positive"
      icon={<span className="text-[15px] font-bold leading-none text-positive">+</span>}
      title={capitalize(income.label)}
      meta={income.source === 'variable' ? t('personal.incomeExtra') : undefined}
      amount={`+${formatAmount(income.amount, income.currency)}`}
      amountTone="text-positive"
    />
  );

  return (
    <Section
      dot="bg-positive"
      title={t('personal.sectionIn')}
      total={formatCurrency(ledger.totalIncome)}
      subtitle={t('personal.incomeCount', { count })}
      footer={<SeeAll
        to={`/personal/incomes?year=${year}&month=${month}`}
        label={t('personal.seeAllIncomes', { count })}
      />}
    >
      {count === 0 ? (
        <p className="px-5 py-8 text-center text-[12.5px] text-muted-2">{t('personal.noIncome')}</p>
      ) : (
        <>
          <SubList
            label={t('personal.everyMonth')}
            total={formatCurrency(sumArs(recurring, rate))}
            rows={recurring.map(row)}
          />
          <SubList
            label={t('personal.dated')}
            total={formatCurrency(sumArs(dated, rate))}
            rows={dated.map(row)}
          />
        </>
      )}
    </Section>
  );
}

/* ── 2. Gastos míos ─────────────────────────────────────────────────────────────────── */

export function OwnExpensesSection({ ledger, categories, year, month }: SectionProps) {
  const { t } = useTranslation();
  const { formatAmount, blueRate } = useCurrency();
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const emojiFor = (category: string) => categories.find(c => c.name === category)?.emoji;

  // Cada fila a pesos con la cotización del backend: así "Cada mes" + "Con fecha" da el total.
  const rate = ledgerRate(ledger, blueRate);
  const recurringTotal = sumArs(ledger.recurringPersonalExpenses, rate);
  const datedTotal = sumArs(ledger.personalExpenses, rate);
  const count = ledger.recurringPersonalExpenses.length + ledger.personalExpenses.length;

  const icon = (category: string) => {
    const emoji = emojiFor(category);
    return emoji
      ? <span className="text-lg leading-none">{emoji}</span>
      : <span className="text-[11px] font-bold uppercase text-muted-2">{category.slice(0, 2)}</span>;
  };

  const recurringRows = ledger.recurringPersonalExpenses.map(e => (
    <Row
      key={`rec-${e.id}`}
      icon={icon(e.categoryName)}
      title={capitalize(e.label)}
      meta={capitalize(t(`categories.${e.categoryName}`, { defaultValue: e.categoryName }))}
      amount={formatAmount(e.amount, e.currency)}
      to={`/personal/expenses?year=${year}&month=${month}&recurring=${e.id}`}
    />
  ));
  const datedRows = [...ledger.personalExpenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => (
      <Row
        key={`exp-${e.id}`}
        icon={icon(e.category)}
        title={capitalize(e.description)}
        meta={`${capitalize(t(`categories.${e.category}`, { defaultValue: e.category }))} · ${formatDayMonth(e.date, monthsShort)}`}
        amount={formatAmount(e.amount, e.currency)}
        to={`/personal/expenses?year=${year}&month=${month}&expense=${e.id}`}
      />
    ));

  return (
    <Section
      dot="bg-negative"
      title={t('personal.sectionMine')}
      total={formatCurrency(ledger.totalPersonalExpenses)}
      subtitle={t('personal.expenseCount', { count })}
      footer={<SeeAll
        to={`/personal/expenses?year=${year}&month=${month}`}
        label={t('personal.seeAllExpenses', { count })}
      />}
    >
      {count === 0 ? (
        <p className="px-5 py-8 text-center text-[12.5px] text-muted-2">{t('personal.noMovements')}</p>
      ) : (
        <>
          <SubList
            label={t('personal.everyMonth')}
            total={formatCurrency(recurringTotal)}
            rows={recurringRows}
          />
          <SubList
            label={t('personal.dated')}
            total={formatCurrency(datedTotal)}
            rows={datedRows}
          />
        </>
      )}
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
              {/*
                El año/mes del link es el del ledger que se está mirando, no `share.date`: el
                backend arma `mirroredShares` leyendo el `MonthlyShare` de ESTE período
                (`get_monthly_share(year, month, groupId)`), y una cuota de crédito guarda la
                fecha de su propio vencimiento — que puede caer en otro mes. Usar esa fecha
                abriría el grupo en un mes donde el gasto no está.
              */}
              {group.shares.slice(0, GROUP_PREVIEW).map(share => (
                <Link
                  key={`${share.sourceExpenseId}-${share.installmentNo}`}
                  to={`/groups/${group.id}?year=${year}&month=${month}&expense=${share.sourceExpenseId}`}
                  className="flex cursor-pointer touch-manipulation items-center gap-2 rounded-lg transition-colors [@media(hover:hover)]:hover:bg-brand-wash active:bg-brand-wash"
                >
                  <span className="w-4 shrink-0 text-center text-[12px] leading-none">
                    {emojiFor(share.category) ?? '·'}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-muted-1">
                    {capitalize(baseDescription(share.description))}
                    {share.installments > 1 && (
                      <span className="text-muted-2">
                        {' · '}{t('personal.installmentShort', { no: share.installmentNo, total: share.installments })}
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-[12px] font-semibold tabular-nums text-muted-1">
                    {formatAmount(share.shareAmount, 'ARS')}
                  </p>
                </Link>
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
