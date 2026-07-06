import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useScroll } from '@/contexts/ScrollContext';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { useCategories } from '@/hooks/useCategories';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { IncomesSection } from '@/components/personal/IncomesSection';
import { PersonalExpensesSection } from '@/components/personal/PersonalExpensesSection';
import { MirroredSharesSection } from '@/components/personal/MirroredSharesSection';
import { PersonalAddLauncher } from '@/components/personal/PersonalAddLauncher';

type Section = 'incomes' | 'expenses' | 'shares';

const TITLE_KEYS: Record<Section, string> = {
  incomes: 'personal.income',
  expenses: 'personal.personalExpenses',
  shares: 'personal.mirroredShares',
};

/** Full-list page for one personal-dashboard section ("View all" target). */
export function PersonalSectionPage({ section }: { section: Section }) {
  const { t } = useTranslation();
  const { notifyScroll } = useScroll();
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    notifyScroll((e.target as HTMLDivElement).scrollTop);
  }, [notifyScroll]);
  const { year, month, setYearMonth } = useMonthSearchParams();
  const { data: ledger, isLoading, refetch } = usePersonalLedger(year, month);
  const { data: categories } = useCategories();

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onScroll={handleScroll}>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
          {/* Header: back link + title */}
          <div>
            <Link
              to={`/personal?year=${year}&month=${month}`}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-brand transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold text-foreground mt-1">{t(TITLE_KEYS[section])}</h1>
          </div>

          {/* Month picker */}
          <MonthPicker year={year} month={month} onNavigate={setYearMonth} />

          {isLoading || !ledger ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : section === 'incomes' ? (
            <IncomesSection ledger={ledger} year={year} month={month} refetch={refetch} />
          ) : section === 'expenses' ? (
            <PersonalExpensesSection ledger={ledger} year={year} month={month} refetch={refetch} categories={categories} />
          ) : (
            <MirroredSharesSection ledger={ledger} year={year} month={month} categories={categories} />
          )}
        </div>
      </div>
      <PersonalAddLauncher ledger={ledger ?? null} year={year} month={month} categories={categories} refetch={refetch} />
    </div>
  );
}
