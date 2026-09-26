import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScroll } from '@/contexts/ScrollContext';
import { useCategories } from '@/hooks/useCategories';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { usePersonalTrend } from '@/hooks/usePersonalTrend';
import { MonthPager } from '@/components/expenses/MonthPager';
import { PersonalCharts } from '@/components/personal/PersonalCharts';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * "Números" — el tercer destino de la barra.
 *
 * Son los mismos gráficos que el home personal muestra al pie, pero en su propia pantalla:
 * mirar cómo viene el mes es una intención distinta de cargar un gasto, y la barra es para
 * lo que se mira seguido (§6.1).
 */
export function PersonalChartsPage() {
  const { t } = useTranslation();
  const { notifyScroll } = useScroll();
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    notifyScroll((e.target as HTMLDivElement).scrollTop);
  }, [notifyScroll]);

  const { year, month, setYearMonth } = useMonthSearchParams();
  const { data: ledger, isLoading } = usePersonalLedger(year, month);
  const { data: categories } = useCategories();

  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [trendRange, setTrendRange] = useState<3 | 6 | 12>(6);
  const { trendData, trendLoading, prevLedger } = usePersonalTrend(year, month, trendRange, ledger);

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0"
        onScroll={handleScroll}
      >
        <div className="mx-auto w-full max-w-5xl space-y-5 px-5 py-6 lg:px-7">
          <div>
            <h1 className="text-[22px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">
              {t('charts.title')}
            </h1>
          </div>

          <MonthPager year={year} month={month} onNavigate={setYearMonth} />

          {isLoading || !ledger ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full rounded-card" />
              <Skeleton className="h-64 w-full rounded-card" />
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
