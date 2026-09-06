import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useScroll } from '@/contexts/ScrollContext';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { getPersonalGroup } from '@/api/personal';
import { useCategories } from '@/hooks/useCategories';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import { PersonalCharts } from '@/components/personal/PersonalCharts';
import { BudgetBar } from '@/components/personal/BudgetBar';
import { DueDatesSection } from '@/components/personal/DueDatesSection';
import { IncomesSection } from '@/components/personal/IncomesSection';
import { PersonalExpensesSection } from '@/components/personal/PersonalExpensesSection';
import { MirroredSharesSection } from '@/components/personal/MirroredSharesSection';
import { PersonalAddLauncher } from '@/components/personal/PersonalAddLauncher';
import { getPersonalLedger } from '@/api/personal';
import type { PersonalLedgerResponse } from '@/types/expense';

/** Rows shown per section on the dashboard; the rest live behind "View all". */
const RECENT_LIMIT = 5;

export function PersonalDashboard() {
  const { t } = useTranslation();
  const { notifyScroll } = useScroll();
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    notifyScroll((e.target as HTMLDivElement).scrollTop);
  }, [notifyScroll]);
  const { year, month, setYearMonth } = useMonthSearchParams();
  const { data: ledger, isLoading, refetch } = usePersonalLedger(year, month);
  const [personalGroupId, setPersonalGroupId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPersonalGroup()
      .then(group => { if (!cancelled) setPersonalGroupId(group.id); })
      .catch(() => { /* la sección de vencimientos simplemente no se muestra */ });
    return () => { cancelled = true; };
  }, []);
  const { data: categories } = useCategories();

  // Chart interactivity
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [trendRange, setTrendRange] = useState<3|6|12>(6);
  const [trendData, setTrendData] = useState<{label: string, income: number, personal: number, groups: number}[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [prevLedger, setPrevLedger] = useState<PersonalLedgerResponse | null>(null);
  const [chartKey, setChartKey] = useState(0);

  // Auto-bump chartKey whenever the main ledger refreshes so trend data stays in sync
  useEffect(() => { setChartKey(k => k + 1); }, [ledger]);

  useEffect(() => {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthNum = month === 1 ? 12 : month - 1;
    getPersonalLedger(prevYear, prevMonthNum).then(setPrevLedger).catch(() => setPrevLedger(null));
  }, [year, month]);

  // Per-month totals cache for the trend chart. Past months rarely change, so
  // only the currently-viewed month is refetched on chartKey bumps (saves) —
  // one request instead of re-firing the whole range.
  const trendCacheRef = useRef(new Map<string, { income: number; personal: number; groups: number }>());

  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pts: {year: number, month: number}[] = [];
    let y = year, m = month;
    for (let i = 0; i < trendRange; i++) {
      pts.unshift({ year: y, month: m });
      if (--m === 0) { m = 12; y--; }
    }
    (async () => {
      const cache = trendCacheRef.current;
      const results: { income: number; personal: number; groups: number }[] = [];
      for (const p of pts) {
        const key = `${p.year}-${p.month}`;
        const isViewedMonth = p.year === year && p.month === month;
        const cached = cache.get(key);
        if (cached && !isViewedMonth) {
          results.push(cached);
          continue;
        }
        // Fetch misses one at a time — a Promise.all burst here can starve
        // the backend connection pool
        const r = await getPersonalLedger(p.year, p.month);
        const point = {
          income: r.totalIncome,
          personal: r.totalPersonalExpenses,
          groups: r.mirroredShares.reduce((s, sh) => s + sh.shareAmount, 0),
        };
        cache.set(key, point);
        results.push(point);
      }
      if (cancelled) return;
      setTrendData(results.map((r, i) => ({
        label: pts[i].year !== year
          ? `${MONTHS[pts[i].month - 1]} '${String(pts[i].year).slice(2)}`
          : MONTHS[pts[i].month - 1],
        ...r,
      })));
    })()
      .catch(() => {})
      .finally(() => { if (!cancelled) setTrendLoading(false); });
    return () => { cancelled = true; };
  }, [year, month, trendRange, chartKey]);

  const launcher = (
    <PersonalAddLauncher ledger={ledger} year={year} month={month} categories={categories} refetch={refetch} />
  );

  // Variable (one-off) spend so far, in ARS — the only portion the budget bar's
  // pace projection extrapolates. Split recurring vs one-off by their nominal
  // ratio, then anchor on the backend's ARS `totalPersonalExpenses` so it stays
  // currency-correct (exact when single-currency; sound ratio if USD+ARS mixed).
  const rawRecurring = (ledger?.recurringPersonalExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const rawVariable = (ledger?.personalExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const rawExpenses = rawRecurring + rawVariable;
  const variableExpensesSoFar = ledger && rawExpenses > 0
    ? ledger.totalPersonalExpenses * (rawVariable / rawExpenses)
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onScroll={handleScroll}>
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
        {launcher}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onScroll={handleScroll}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">{t('personal.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('personal.subtitle')}</p>
      </div>

      {/* Month picker */}
      <div className="mb-5">
        <MonthPicker year={year} month={month} onNavigate={setYearMonth} />
      </div>

      {/* Summary stats */}
      <div className="w-full space-y-5">

      {/* Balance summary cards */}
      {ledger && (
        <div className="space-y-3">
          {/* Income + expenses row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
              <p className="text-xs text-muted-foreground">{t('personal.totalIncome')}</p>
              <p className="text-sm font-bold text-green-600 mt-1 truncate">{formatCurrency(ledger.totalIncome)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
              <p className="text-xs text-muted-foreground">{t('personal.totalExpenses')}</p>
              <p className="text-sm font-bold text-red-500 mt-1 truncate">{formatCurrency(ledger.totalPersonalExpenses)}</p>
            </div>
          </div>

          {/* Budget bar */}
          <BudgetBar
            totalIncome={ledger.totalIncome}
            totalExpenses={ledger.totalPersonalExpenses}
            currentBalance={ledger.currentBalance}
            projectedBalance={ledger.projectedBalance}
            pendingSettlementsTotal={ledger.pendingSettlementsTotal}
            variableExpensesSoFar={variableExpensesSoFar}
            year={year}
            month={month}
            formatAmt={formatCurrency}
          />

          {/* Main balance card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {/* Current balance: actual cash right now */}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('personal.currentBalance')}</p>
                <p className="text-xs text-muted-foreground">{t('personal.currentBalanceDesc')}</p>
              </div>
              <p className={`text-xl font-bold whitespace-nowrap flex-shrink-0 ml-3 ${ledger.currentBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(ledger.currentBalance)}
              </p>
            </div>

            {/* Projected — only shown when pending settlements exist */}
            {Math.abs(ledger.pendingSettlementsTotal) > 0.01 && (
              <>
                <div className="border-t border-border/50" />
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t('personal.projectedBalance')}</p>
                    <p className="text-xs text-muted-foreground">
                      {ledger.pendingSettlementsTotal > 0
                        ? t('personal.afterReceiving', { amount: formatCurrency(ledger.pendingSettlementsTotal) })
                        : t('personal.afterPaying', { amount: formatCurrency(Math.abs(ledger.pendingSettlementsTotal)) })}
                    </p>
                  </div>
                  <p className={`text-lg font-bold whitespace-nowrap flex-shrink-0 ml-3 ${ledger.projectedBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(ledger.projectedBalance)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settlement positions (per-group net balances) */}
      {ledger && ledger.groupBalances.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground">{t('personal.settlementPositions')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('personal.settlementPositionsDesc')}</p>
          <div className="space-y-1.5">
            {ledger.groupBalances.map(gb => (
              <div key={gb.sourceGroupId} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{gb.sourceGroupName}</span>
                <div className="flex items-center gap-2">
                  {gb.isSettled && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {t('personal.realized')}
                    </span>
                  )}
                  <span className={gb.netBalance >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {gb.netBalance >= 0 ? '+' : ''}{formatCurrency(gb.netBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Divider + net total */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">{t('personal.netAtSettlement')}</span>
            {Math.abs(ledger.pendingSettlementsTotal) > 0.01 ? (
              <span className="text-amber-600 font-bold">
                {ledger.pendingSettlementsTotal > 0
                  ? `+${formatCurrency(ledger.pendingSettlementsTotal)} ${t('personal.willReceive')}`
                  : `-${formatCurrency(Math.abs(ledger.pendingSettlementsTotal))} ${t('personal.willPay')}`}
              </span>
            ) : (
              <span className="text-muted-foreground">{t('personal.balanced')}</span>
            )}
          </div>
        </div>
      )}

      </div>{/* end summary */}

      {/* Two-column grid on desktop, single column on mobile */}
      {ledger && (
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* LEFT COLUMN: income + personal expenses */}
          <div className="space-y-5">
            <IncomesSection
              ledger={ledger}
              year={year}
              month={month}
              refetch={refetch}
              limit={RECENT_LIMIT}
              viewAllTo={`/personal/incomes?year=${year}&month=${month}`}
            />
            <PersonalExpensesSection
              ledger={ledger}
              year={year}
              month={month}
              refetch={refetch}
              categories={categories}
              limit={RECENT_LIMIT}
              viewAllTo={`/personal/expenses?year=${year}&month=${month}`}
            />
          </div>

          {/* RIGHT COLUMN: mirrored shares */}
          <div className="space-y-5">
            <MirroredSharesSection
              ledger={ledger}
              year={year}
              month={month}
              categories={categories}
              limit={RECENT_LIMIT}
              viewAllTo={`/personal/shares?year=${year}&month=${month}`}
            />
            {personalGroupId !== null && <DueDatesSection groupId={personalGroupId} />}
          </div>
        </div>
      )}

      {/* ── Analytics (full width) ──────────────────────────────── */}
      {ledger && (
        <PersonalCharts
          ledger={ledger}
          prevLedger={prevLedger}
          year={year}
          month={month}
          categories={categories}
          hiddenCategories={hiddenCategories}
          onToggleCategory={(cat) => setHiddenCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
          })}
          trendRange={trendRange}
          onTrendRangeChange={setTrendRange}
          trendData={trendData}
          trendLoading={trendLoading}
        />
      )}
      </div>
      </div>
      {launcher}
    </div>
  );
}
