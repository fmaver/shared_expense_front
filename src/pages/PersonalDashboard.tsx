import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useScroll } from '@/contexts/ScrollContext';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { usePersonalTrend } from '@/hooks/usePersonalTrend';
import { usePendingTransfers } from '@/hooks/usePendingTransfers';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { getPersonalGroup } from '@/api/personal';
import { useCategories } from '@/hooks/useCategories';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { avatarBg, initials } from '@/utils/avatar';
import { PersonalCharts } from '@/components/personal/PersonalCharts';
import { BudgetBar } from '@/components/personal/BudgetBar';
import {
  IncomeSection, OwnExpensesSection, GroupSharesSection,
} from '@/components/personal/LedgerSections';
import { SettleUpCard } from '@/components/personal/SettleUpCard';
import { DueDatesSection } from '@/components/personal/DueDatesSection';
import { PersonalAddLauncher } from '@/components/personal/PersonalAddLauncher';

export function PersonalDashboard() {
  const { t } = useTranslation();
  const { notifyScroll } = useScroll();
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    notifyScroll((e.target as HTMLDivElement).scrollTop);
  }, [notifyScroll]);

  const { year, month, setYearMonth } = useMonthSearchParams();
  const { data: ledger, isLoading, refetch } = usePersonalLedger(year, month);
  const { data: categories } = useCategories();
  const currentMember = useCurrentMember();
  const [personalGroupId, setPersonalGroupId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPersonalGroup()
      .then(group => { if (!cancelled) setPersonalGroupId(group.id); })
      .catch(() => { /* la sección de vencimientos simplemente no se muestra */ });
    return () => { cancelled = true; };
  }, []);

  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [trendRange, setTrendRange] = useState<3 | 6 | 12>(6);
  const { trendData, trendLoading, prevLedger } = usePersonalTrend(year, month, trendRange, ledger);

  const { groups: pendingGroups } = usePendingTransfers(
    year, month, ledger?.groupBalances, currentMember?.id ?? null,
  );

  const launcher = (
    <PersonalAddLauncher ledger={ledger ?? null} year={year} month={month} categories={categories} refetch={refetch} />
  );

  // Gasto variable acumulado, en ARS: es lo único que la proyección de ritmo extrapola, porque
  // lo recurrente ya cayó entero. Se reparte por la proporción nominal y se ancla en el total
  // en ARS del backend, así queda correcto aunque haya pesos y dólares mezclados.
  const rawRecurring = (ledger?.recurringPersonalExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const rawVariable = (ledger?.personalExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const rawExpenses = rawRecurring + rawVariable;
  const variableExpensesSoFar = ledger && rawExpenses > 0
    ? ledger.totalPersonalExpenses * (rawVariable / rawExpenses)
    : 0;

  const groupShare = (ledger?.mirroredShares ?? []).reduce((s, sh) => s + sh.shareAmount, 0);

  const months = t('months', { returnObjects: true }) as string[];
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const goMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYearMonth(next.getFullYear(), next.getMonth() + 1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onScroll={handleScroll}>
          <div className="mx-auto max-w-5xl space-y-4 px-5 py-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full rounded-card-lg" />
            <Skeleton className="h-48 w-full rounded-card" />
          </div>
        </div>
        {launcher}
      </div>
    );
  }

  const pending = ledger?.pendingSettlementsTotal ?? 0;
  const hasPending = Math.abs(pending) > 0.01;
  const projectedDelta = ledger ? ledger.projectedBalance - ledger.currentBalance : 0;
  const openGroupBalances = (ledger?.groupBalances ?? [])
    .filter(g => !g.isSettled && Math.abs(g.netBalance) > 0.01);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onScroll={handleScroll}>
        <div className="mx-auto w-full max-w-5xl px-5 py-5 lg:px-7 lg:py-6">

          {/* ── Encabezado: el mes como eyebrow, el saludo como título ──────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                {months[month - 1]} {year}
              </p>
              <h1 className="mt-1 truncate text-[23px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">
                {t('personal.greeting', { name: currentMember?.name ?? '' })}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                aria-label={t('monthPager.previous')}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-line-strong text-foreground transition-colors hover:bg-surface-sunken"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {/* Se puede ir al futuro: los fijos y las cuotas ya viven en los meses que vienen. */}
              <button
                type="button"
                onClick={() => goMonth(1)}
                aria-label={t('monthPager.next')}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-line-strong text-foreground transition-colors hover:bg-surface-sunken"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                to="/profile"
                aria-label={t('nav.profile')}
                className={cn(
                  'flex h-9 w-9 select-none items-center justify-center rounded-full text-[12px] font-bold text-white',
                  avatarBg(currentMember?.id ?? 1),
                )}
              >
                {initials(currentMember?.name ?? '?')}
              </Link>
            </div>
          </div>

          {/*
            Columnas con mínimo 0, y no el `auto` de una columna implícita: con `auto` la columna
            nunca es más angosta que el contenido sin cortes más ancho que lleve adentro, y algo
            que llega tarde (la tendencia, una tarjeta de saldar, una cifra grande) la ensanchaba
            más que la pantalla. Todas las tarjetas se estiraban juntas, el `overflow-x-hidden`
            les cortaba el borde derecho, y en iOS la página quedaba más ancha que el viewport,
            que es lo que habilita el zoom hacia afuera y el paneo lateral.
          */}
          {ledger && (
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">

              <div className="min-w-0 space-y-3">
              {/* ── La cifra protagonista ────────────────────────────────────────── */}
              <div className="rounded-card-lg border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-muted-1">{t('personal.leftThisMonth')}</p>
                  {isCurrentMonth && (
                    <span className="shrink-0 rounded-full bg-positive-wash px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-positive">
                      {t('personal.inProgress')}
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-[40px] font-extrabold leading-none tracking-[-0.025em] tabular-nums text-foreground">
                  {formatCurrency(ledger.currentBalance)}
                </p>
                <p className="mt-1.5 text-[12.5px] font-medium leading-[1.5] text-muted-1">
                  <Trans
                    i18nKey="personal.todayOfIncome"
                    values={{ income: formatCurrency(ledger.totalIncome) }}
                    components={[<strong className="font-bold text-foreground" />]}
                  />
                </p>

                {/* Proyectado: cómo queda el mes cuando se salden los grupos abiertos. */}
                {hasPending && (
                  <div className="mt-3.5 border-t border-dashed border-line-strong pt-[13px]">
                    {/* Con `flex-wrap`: con cifras grandes o en una pantalla angosta el monto baja de
                        renglón en vez de salirse de la tarjeta. */}
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-1">
                      <span className="text-[12px] font-semibold text-muted-1">{t('personal.projected')}</span>
                      <span className="flex items-baseline gap-[7px]">
                        <span
                          className={cn(
                            'rounded-full px-[7px] py-0.5 text-[11px] font-bold tabular-nums',
                            projectedDelta >= 0 ? 'bg-positive-wash text-positive' : 'bg-negative-wash text-negative',
                          )}
                        >
                          {projectedDelta >= 0 ? '+' : '−'}{formatCurrency(Math.abs(projectedDelta))}
                        </span>
                        <span className="text-[20px] font-extrabold tracking-[-0.025em] tabular-nums text-foreground">
                          {formatCurrency(ledger.projectedBalance)}
                        </span>
                      </span>
                    </div>
                    {openGroupBalances.length > 0 && (
                      <p className="mt-[5px] text-[11.5px] font-medium leading-[1.5] text-muted-1">
                        {t('personal.whenSettled', { month: (months[month - 1] ?? '').toLocaleLowerCase() })}{' '}
                        {openGroupBalances.map((g, i) => (
                          <React.Fragment key={g.sourceGroupId}>
                            {i > 0 && (i === openGroupBalances.length - 1 ? ` ${t('groups.and')} ` : ', ')}
                            <Trans
                              i18nKey={g.netBalance > 0 ? 'personal.collectFrom' : 'personal.payTo'}
                              values={{ amount: formatCurrency(Math.abs(g.netBalance)), group: g.sourceGroupName }}
                              components={[
                                <strong className={cn('font-bold tabular-nums', g.netBalance > 0 ? 'text-positive' : 'text-negative')} />,
                              ]}
                            />
                          </React.Fragment>
                        ))}
                        .
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <BudgetBar
                    totalIncome={ledger.totalIncome}
                    totalExpenses={ledger.totalPersonalExpenses}
                    groupShare={groupShare}
                    variableExpensesSoFar={variableExpensesSoFar}
                    year={year}
                    month={month}
                    formatAmt={formatCurrency}
                  />
                </div>
              </div>

              {/*
                Tres secciones, no una cronología. La lista unificada mezclaba plata que entró
                con plata que salió y con lo que te toca de los grupos: para saber cuánto
                gastaste había que sumar mentalmente salteándose filas. Cada sección tiene su
                total arriba, y los tres cierran contra lo que entró (la nota al pie).
              */}
              <p className="px-1 pt-1 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
                {t('personal.scrollHint')}
              </p>

              <IncomeSection ledger={ledger} categories={categories} year={year} month={month} />
              <OwnExpensesSection ledger={ledger} categories={categories} year={year} month={month} />
              <GroupSharesSection ledger={ledger} categories={categories} year={year} month={month} />

              {/* La cuenta que cierra: los tres totales contra el ingreso del mes. */}
              {ledger.totalIncome > 0 && (
                <p className="px-1 text-[11.5px] font-medium leading-[1.5] text-muted-2">
                  {t('personal.closesAgainst', {
                    own: formatCurrency(ledger.totalPersonalExpenses),
                    groups: formatCurrency(groupShare),
                    left: formatCurrency(Math.max(ledger.totalIncome - ledger.totalPersonalExpenses - groupShare, 0)),
                    income: formatCurrency(ledger.totalIncome),
                  })}
                </p>
              )}

              </div>

              <div className="min-w-0 space-y-3">
              {/* ── Para cerrar cada grupo ───────────────────────────────────────── */}
              {currentMember && pendingGroups.map(group => (
                <SettleUpCard
                  key={group.groupId}
                  group={group}
                  currentMemberId={currentMember.id}
                  year={year}
                  month={month}
                />
              ))}

              {personalGroupId !== null && (
                <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                  <DueDatesSection groupId={personalGroupId} />
                </div>
              )}

              {/* ── En qué se te va ──────────────────────────────────────────────── */}
              <PersonalCharts
                ledger={ledger}
                prevLedger={prevLedger}
                year={year}
                month={month}
                categories={categories}
                hiddenCategories={hiddenCategories}
                onToggleCategory={cat => setHiddenCategories(prev => {
                  const next = new Set(prev);
                  if (next.has(cat)) next.delete(cat); else next.add(cat);
                  return next;
                })}
                trendRange={trendRange}
                onTrendRangeChange={setTrendRange}
                trendData={trendData}
                trendLoading={trendLoading}
              />
              </div>
            </div>
          )}
        </div>
      </div>
      {launcher}
    </div>
  );
}
