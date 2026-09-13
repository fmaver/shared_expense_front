import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import { useGroup } from '@/hooks/useGroups';
import { useCategories } from '@/hooks/useCategories';
import { useExpenseRefresh } from '@/contexts/ExpenseRefreshContext';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useSettlementState } from '@/contexts/SettlementContext';
import { CategoryBarList } from '@/components/charts/CategoryBarList';
import { MonthPager } from '@/components/expenses/MonthPager';
import { getGroupTrend } from '@/api/shares';
import type { MonthTrendPoint } from '@/api/shares';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

/** Una categoría que se lleva más de esto es "casi todo"; por debajo, sólo "lo más grande". */
const DOMINANT_SHARE = 0.5;
const NOTABLE_SHARE = 0.3;
/** Debajo de esta diferencia, dos meses gastaron "casi lo mismo". */
const SAME_THRESHOLD = 2;

export function GroupChartsPage() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { t } = useTranslation();
  const { year, month, setYearMonth } = useMonthSearchParams();
  const [trend, setTrend] = useState<MonthTrendPoint[]>([]);

  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  // Igual que en la lista: hasta que el tipo de grupo se conoce, nada con forma de mes puede
  // salir. Un grupo de evento no tiene meses y pedirle uno es pedirle algo que no existe.
  const groupTypeKnown = !loadingGroup && group !== undefined;
  const isOneTime = group?.groupType === 'one_time';

  const { data: balance } = useMonthlyBalance(groupId, year, month, isOneTime, groupTypeKnown);
  const { data: members } = useGroupMembers(groupId);
  const { data: categories } = useCategories();
  const { refreshSignal } = useExpenseRefresh();
  const currentMember = useCurrentMember();

  const { setViewedMonthState } = useSettlementState();
  useEffect(() => {
    setViewedMonthState({
      isSettled: balance?.isSettled ?? false,
      yourBalance: currentMember && balance
        ? (balance.balances[String(currentMember.id)] ?? 0)
        : null,
    });
    return () => setViewedMonthState({ isSettled: false, yourBalance: null });
  }, [balance, currentMember, setViewedMonthState]);

  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  useEffect(() => {
    if (isOneTime) return;
    getGroupTrend(groupId, 6).then(setTrend);
  }, [groupId, refreshSignal, isOneTime]);

  const memberName = (id: number | string) =>
    members.find(m => m.id === Number(id))?.name ?? `#${id}`;

  // Los movimientos internos no son gasto del grupo: son plata que ya se movió entre ustedes.
  const expenses = (balance?.expenses ?? []).filter(
    e => e.category !== 'balance' && e.category !== 'prestamo',
  );
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  /* ── Categorías ───────────────────────────────────────────────────────────────────── */
  const categoryMap: Record<string, number> = {};
  for (const e of expenses) categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  /* ── Quién puso cuánto, y en qué forma ────────────────────────────────────────────── */
  const payerMap: Record<number, number> = {};
  for (const e of expenses) payerMap[e.payerId] = (payerMap[e.payerId] ?? 0) + e.amount;
  const payerData = Object.entries(payerMap).map(([id, value]) => ({ name: memberName(id), value }));

  let debitTotal = 0;
  let creditTotal = 0;
  for (const e of expenses) {
    if (e.paymentType === 'credit') creditTotal += e.amount;
    else debitTotal += e.amount;
  }
  const paymentTypeData = [
    { name: t('charts.debit'), value: debitTotal },
    { name: t('charts.credit'), value: creditTotal },
  ].filter(d => d.value > 0);

  /* ── La frase que explica el mes ──────────────────────────────────────────────────────
     Es la protagonista de la pantalla: dice en palabras lo que los gráficos muestran, para
     que no haya que leer un eje para entender cómo viene el mes (§6.3).                  */
  const groupName = group?.name ?? '';
  const viewedPoint = trend.find(p => p.year === year && p.month === month);
  const viewedIndex = trend.findIndex(p => p.year === year && p.month === month);
  const prevPoint = viewedIndex > 0 ? trend[viewedIndex - 1] : null;

  const summary = (() => {
    if (total <= 0) {
      return isOneTime
        ? t('charts.summaryEmptyEvent')
        : t('charts.summaryEmpty', { month: months[month - 1]?.toLowerCase() });
    }
    const amount = formatCurrency(total);
    if (isOneTime) return t('charts.summaryEvent', { group: groupName, amount });

    const base = { group: groupName, amount, month: months[month - 1]?.toLowerCase() };
    if (!prevPoint || prevPoint.total <= 0) return t('charts.summaryPlain', base);

    const reference = viewedPoint?.total ?? total;
    const delta = ((reference - prevPoint.total) / prevPoint.total) * 100;
    const prev = months[prevPoint.month - 1]?.toLowerCase();
    if (Math.abs(delta) < SAME_THRESHOLD) return t('charts.summarySame', { ...base, prev });
    return t(delta > 0 ? 'charts.summaryMore' : 'charts.summaryLess', {
      ...base, prev, pct: Math.abs(Math.round(delta)),
    });
  })();

  const topCategory = categoryData[0];
  const categorySentence = (() => {
    if (!topCategory || total <= 0) return null;
    const share = topCategory.value / total;
    const category = t(`categories.${topCategory.name}`, { defaultValue: topCategory.name })
      .toLocaleLowerCase();
    if (share >= DOMINANT_SHARE) return t('charts.dominantCategory', { category });
    if (share >= NOTABLE_SHARE) return t('charts.topCategory', { category });
    return null;
  })();

  /* ── Barras de los últimos meses ──────────────────────────────────────────────────── */
  const trendMax = Math.max(...trend.map(p => p.total), 0);
  const noData = expenses.length === 0;

  const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-[13px] font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-5 py-4 lg:px-7 lg:py-6">
      {!isOneTime && (
        <MonthPager
          year={year}
          month={month}
          onNavigate={setYearMonth}
          isSettled={balance?.isSettled}
        />
      )}

      {/* La frase primero: una sola cifra protagonista por pantalla */}
      <p className="font-display text-[20px] leading-[1.45] text-foreground">
        {summary}
        {categorySentence && <> {categorySentence}</>}
      </p>

      {/* Últimos meses — el mes visto en `brand`, el anterior en `brand-soft`, el resto apagado */}
      {!isOneTime && trend.length > 0 && (
        <Block title={t('charts.lastMonths', { count: trend.length })}>
          <div className="flex items-stretch justify-between gap-2" style={{ height: 140 }}>
            {trend.map(point => {
              const isViewed = point.year === year && point.month === month;
              const isPrev = prevPoint != null
                && point.year === prevPoint.year && point.month === prevPoint.month;
              const heightPct = trendMax > 0 ? (point.total / trendMax) * 100 : 0;
              return (
                <div key={`${point.year}-${point.month}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'w-full text-center text-[10px] font-bold tabular-nums',
                      isViewed ? 'text-foreground' : 'text-muted-2',
                    )}
                  >
                    {point.total > 0 ? Math.round(point.total / 1000) + 'k' : ''}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={cn(
                        'w-full rounded-t-chip transition-all',
                        isViewed ? 'bg-brand' : isPrev ? 'bg-brand-soft' : 'bg-surface-sunken',
                      )}
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10.5px] font-semibold capitalize',
                      isViewed ? 'text-foreground' : 'text-muted-2',
                    )}
                  >
                    {monthsShort[point.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {/* Categorías */}
      <Block title={t('charts.categoryBreakdown')}>
        {noData ? (
          <p className="text-[12.5px] text-muted-2">{t('charts.noData')}</p>
        ) : (
          <CategoryBarList
            items={categoryData.map(d => ({
              ...d,
              name: t(`categories.${d.name}`, { defaultValue: d.name }),
              emoji: categories.find(c => c.name === d.name)?.emoji,
            }))}
            formatValue={formatCurrency}
          />
        )}
      </Block>

      {/*
        Quién puso cuánto y en qué forma.
        El handoff (§6.3) no los dibuja en esta pantalla, pero son datos que ya existían: se
        conservan en el mismo lenguaje de barras en vez de borrarlos por omisión.
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Block title={t('charts.payerBreakdown')}>
          {noData ? (
            <p className="text-[12.5px] text-muted-2">{t('charts.noData')}</p>
          ) : (
            <CategoryBarList items={payerData} formatValue={formatCurrency} />
          )}
        </Block>
        <Block title={t('charts.paymentType')}>
          {noData ? (
            <p className="text-[12.5px] text-muted-2">{t('charts.noData')}</p>
          ) : (
            <CategoryBarList items={paymentTypeData} formatValue={formatCurrency} />
          )}
        </Block>
      </div>
    </div>
  );
}
