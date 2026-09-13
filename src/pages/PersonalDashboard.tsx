import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { MovementsList } from '@/components/personal/MovementsList';
import { SettleUpCard } from '@/components/personal/SettleUpCard';
import { DueDatesSection } from '@/components/personal/DueDatesSection';
import { PersonalAddLauncher } from '@/components/personal/PersonalAddLauncher';

/** Movimientos que entran en el home; las listas completas viven en su pantalla. */
const RECENT_LIMIT = 6;

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

  const { groups: pendingGroups, reload: reloadTransfers } = usePendingTransfers(
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
              <h1 className="mt-1 truncate font-display text-[27px] leading-[1.1] text-foreground">
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
              <button
                type="button"
                onClick={() => goMonth(1)}
                disabled={isCurrentMonth}
                aria-label={isCurrentMonth ? t('monthPager.atCurrentMonth') : t('monthPager.next')}
                className={cn(
                  'flex h-[34px] w-[34px] items-center justify-center rounded-full border',
                  isCurrentMonth
                    ? 'cursor-default border-transparent bg-surface-sunken text-muted-3'
                    : 'cursor-pointer border-line-strong text-foreground transition-colors hover:bg-surface-sunken',
                )}
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

          {ledger && (
            <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">

              <div className="space-y-3">
              {/* ── La cifra protagonista ────────────────────────────────────────── */}
              <div className="rounded-card-lg border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-muted-1">{t('personal.leftThisMonth')}</p>
                  {isCurrentMonth && (
                    <span className="shrink-0 rounded-pill bg-positive-wash px-2.5 py-1 text-[11px] font-bold text-positive">
                      {t('personal.inProgress')}
                    </span>
                  )}
                </div>

                <p className="mt-2 font-display text-[48px] leading-none tracking-[-0.02em] tabular-nums text-foreground">
                  {formatCurrency(ledger.currentBalance)}
                </p>

                {hasPending && (
                  <p className="mt-2.5 text-[12.5px] font-medium leading-[1.45] text-muted-1">
                    {t(pending > 0 ? 'personal.afterCollecting' : 'personal.afterSettling', {
                      projected: formatCurrency(ledger.projectedBalance),
                      pending: formatCurrency(Math.abs(pending)),
                    })}
                  </p>
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

              {/* ── Movimientos ──────────────────────────────────────────────────── */}
              <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
                <div className="px-5 pb-3 pt-4">
                  <h2 className="font-display text-[19px] leading-none text-foreground">
                    {t('personal.movements')}
                  </h2>
                </div>
                <MovementsList ledger={ledger} categories={categories} limit={RECENT_LIMIT} />
                {/*
                  Las tres listas completas siguen viviendo en su pantalla, con sus formularios
                  de alta y edición: la vista unificada es un resumen, no un reemplazo.
                */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-5 py-3">
                  {[
                    { to: `/personal/incomes?year=${year}&month=${month}`, label: t('personal.seeIncomes') },
                    { to: `/personal/expenses?year=${year}&month=${month}`, label: t('personal.seeExpenses') },
                    { to: `/personal/shares?year=${year}&month=${month}`, label: t('personal.seeShares') },
                  ].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              </div>

              <div className="space-y-3">
              {/* ── Para cerrar cada grupo ───────────────────────────────────────── */}
              {currentMember && pendingGroups.map(group => (
                <SettleUpCard
                  key={group.groupId}
                  group={group}
                  currentMemberId={currentMember.id}
                  onPaid={() => { refetch(); reloadTransfers(); }}
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
