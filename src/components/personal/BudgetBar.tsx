import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetBarProps {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  projectedBalance: number;
  pendingSettlementsTotal: number;
  /** One-off (non-recurring) personal spend so far this month, in ARS. Only
   *  this portion is extrapolated for the pace projection — fixed recurring
   *  bills and pending group costs are already inside `projectedBalance`. */
  variableExpensesSoFar: number;
  year: number;
  month: number;
  formatAmt: (n: number) => string;
}

export function BudgetBar({ totalIncome, totalExpenses, currentBalance, projectedBalance, pendingSettlementsTotal, variableExpensesSoFar, year, month, formatAmt }: BudgetBarProps) {
  const { t } = useTranslation();
  if (totalIncome <= 0.01) return null;

  // Personal expenses zone (rose, left-anchored)
  const personalPct = Math.min(100, Math.max(0, (totalExpenses / totalIncome) * 100));

  // Three-zone bar: personal (rose) | group net costs (amber) | projected savings (emerald)
  // Green zone = projected savings as % of income, right-anchored.
  // Amber fills the gap between personal and green so the green zone width
  // directly matches the projected savings rate — 1% savings → 1% green.
  const projectedPctRaw = (projectedBalance / totalIncome) * 100;
  const greenPct = Math.min(100 - personalPct, Math.max(0, projectedPctRaw));
  const amberPct = Math.max(0, 100 - personalPct - greenPct);
  // Indicator sits at the amber→green boundary = start of savings
  const indicatorPct = 100 - greenPct;

  const hasPending = Math.abs(pendingSettlementsTotal) > 0.01;
  // Show indicator only when both amber and green zones have meaningful width
  const showProjected = hasPending && greenPct > 0.5 && amberPct > 0.5;

  const projectedSavingsRate = Math.max(0, Math.round(projectedPctRaw));
  const currentSavingsRate = Math.max(0, Math.round((currentBalance / totalIncome) * 100));
  const isOverBudget = projectedBalance < 0 || totalExpenses > totalIncome;

  // Status pill — semantic tint by projected savings health
  const status = isOverBudget
    ? { label: t('personal.overBudget'), cls: 'text-rose-600 bg-rose-500/15 dark:text-rose-300' }
    : projectedSavingsRate >= 30
    ? { label: t('personal.onTrack'), cls: 'text-emerald-600 bg-emerald-500/15 dark:text-emerald-300' }
    : projectedSavingsRate > 0
    ? { label: t('personal.tight'), cls: 'text-amber-600 bg-amber-500/15 dark:text-amber-400' }
    : { label: t('personal.overBudget'), cls: 'text-rose-600 bg-rose-500/15 dark:text-rose-300' };

  // Legend amounts derive from the same zone math so they always match the bar
  const amberAmount = (totalIncome * amberPct) / 100;
  const greenAmount = (totalIncome * greenPct) / 100;

  // Insight line: pace-based projection for the current month, actual result for past months.
  // Pace = projectedBalance (already nets out recurring bills + pending group costs)
  // minus the *extra* variable spend expected for the remaining days. Derived from
  // projectedBalance, so it can never contradict the emerald "projected savings" zone.
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isPastMonth = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  let insight: string | null = null;
  if (isCurrentMonth) {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    if (dayOfMonth >= 1 && totalExpenses > 0) {
      const remainingFactor = (daysInMonth - dayOfMonth) / dayOfMonth;
      const paceSavings = projectedBalance - variableExpensesSoFar * remainingFactor;
      insight = paceSavings >= 0
        ? t('personal.paceInsight', { amount: formatAmt(paceSavings) })
        : t('personal.paceOverspend', { amount: formatAmt(Math.abs(paceSavings)) });
    }
  } else if (isPastMonth) {
    insight = projectedBalance >= 0
      ? t('personal.monthResult', { amount: formatAmt(projectedBalance) })
      : t('personal.monthResultNegative', { amount: formatAmt(Math.abs(projectedBalance)) });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t('personal.budgetBar')}</p>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', status.cls)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {isOverBudget ? status.label : `${status.label} · ${t('personal.projectedSavings', { rate: projectedSavingsRate })}`}
          </span>
          {hasPending && !isOverBudget && (
            <span className="text-xs text-muted-foreground">
              {t('personal.savingsRate', { rate: currentSavingsRate })}
            </span>
          )}
        </div>
      </div>

      {/* Bar — chip headroom is PADDING on a wrapper: the card's space-y-*
          margin selector outranks an mt-* here and would collapse it,
          letting the chip float into the header row */}
      <div className={cn(showProjected && 'pt-9')}>
      <div className="relative h-3.5">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Track */}
          <div className="absolute inset-0 bg-muted" />
          {/* Personal expenses (rose) */}
          {personalPct > 0 && (
            <div
              className="absolute left-0 top-0 h-full bg-rose-400 dark:bg-rose-500 transition-[width] duration-700 ease-out"
              style={{ width: `${personalPct}%` }}
            />
          )}
          {/* Group net costs (amber) */}
          {amberPct > 0 && (
            <div
              className="absolute top-0 h-full bg-amber-400 dark:bg-amber-500 transition-all duration-700 ease-out"
              style={{ left: `${personalPct}%`, right: `${greenPct}%` }}
            />
          )}
          {/* Projected savings (emerald hatch, right-anchored) — the diagonal
              stripe reads as "what you keep / projected" vs the solid zones */}
          {greenPct > 0 && (
            <div
              className="savings-hatch absolute top-0 h-full transition-all duration-700 ease-out"
              style={{ left: `${indicatorPct}%`, right: 0 }}
            />
          )}
        </div>
        {/* Projected marker: floating amount chip above a vertical line */}
        {showProjected && (
          <>
            <div
              className="absolute -top-7 z-20 -translate-x-1/2 pointer-events-none select-none transition-[left] duration-700 ease-out"
              style={{ left: `${Math.max(12, Math.min(88, indicatorPct))}%` }}
            >
              <span className="block rounded-full bg-foreground text-background text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap shadow-sm tabular-nums">
                {formatAmt(projectedBalance)}
              </span>
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-7 bg-foreground/70 dark:bg-foreground/60 rounded-full z-10 transition-[left] duration-700 ease-out"
              style={{ left: `calc(${indicatorPct}% - 1px)` }}
            />
          </>
        )}
      </div>
      </div>

      {/* Legend — amounts match the bar zones */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400 dark:bg-rose-500 shrink-0" />
          <span className="text-muted-foreground">{t('personal.legendExpenses')}</span>
          <span className="font-semibold text-foreground tabular-nums">{formatAmt(totalExpenses)}</span>
        </span>
        {hasPending && amberPct > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500 shrink-0" />
            <span className="text-muted-foreground">{t('personal.legendPending')}</span>
            <span className="font-semibold text-foreground tabular-nums">{formatAmt(amberAmount)}</span>
          </span>
        )}
        {greenPct > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="savings-hatch h-2 w-2 rounded-full shrink-0" />
            <span className="text-muted-foreground">{t('personal.legendProjected')}</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatAmt(greenAmount)} ({projectedSavingsRate}%)
            </span>
          </span>
        )}
      </div>

      {/* Insight line */}
      {insight && (
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-border/50 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
          <span>{insight}</span>
        </div>
      )}
    </div>
  );
}
