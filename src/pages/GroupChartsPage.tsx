import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import { useCategories } from '@/hooks/useCategories';
import { useExpenseRefresh } from '@/contexts/ExpenseRefreshContext';
import { CategoryBarList } from '@/components/charts/CategoryBarList';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { getGroupTrend } from '@/api/shares';
import type { MonthTrendPoint } from '@/api/shares';
import { CHART_COLORS, SERIES } from '@/constants/chartColors';

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function GroupChartsPage() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { t } = useTranslation();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [trend, setTrend] = useState<MonthTrendPoint[]>([]);

  const { data: balance } = useMonthlyBalance(groupId, year, month);
  const { data: members } = useGroupMembers(groupId);
  const { data: categories } = useCategories();
  const { refreshSignal } = useExpenseRefresh();

  // `balance` auto-refreshes via useMonthlyBalance; the trend has its own fetch,
  // so refetch it too when an expense is created (refreshSignal bumps).
  useEffect(() => {
    getGroupTrend(groupId, 6).then(setTrend);
  }, [groupId, refreshSignal]);

  const memberName = (id: number | string) => {
    const found = members.find(m => m.id === Number(id));
    return found ? found.name : `#${id}`;
  };

  const expenses = (balance?.expenses ?? []).filter(
    e => e.category !== 'balance' && e.category !== 'prestamo'
  );

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  for (const e of expenses) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
  }
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Payer breakdown
  const payerMap: Record<number, number> = {};
  for (const e of expenses) {
    payerMap[e.payerId] = (payerMap[e.payerId] ?? 0) + e.amount;
  }
  const payerData = Object.entries(payerMap).map(([id, value]) => ({
    name: memberName(id),
    value,
  }));

  // Payment type breakdown
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

  // Trend data
  const trendData = trend.map(p => ({
    name: `${MONTH_ABBREVS[p.month - 1]} ${p.year}`,
    total: Math.round(p.total),
  }));

  const noData = expenses.length === 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{t('charts.title')}</h1>
        <MonthPicker
          year={year}
          month={month}
          onNavigate={(y, m) => { setYear(y); setMonth(m); }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
          <h2 className="text-sm font-semibold text-foreground mb-3">{t('charts.categoryBreakdown')}</h2>
          {noData ? (
            <p className="text-sm text-muted-foreground">{t('charts.noData')}</p>
          ) : (
            <CategoryBarList
              items={categoryData.map(d => ({ ...d, emoji: categories.find(c => c.name === d.name)?.emoji }))}
              formatValue={(v) => v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            />
          )}
        </div>

        {/* Payer breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
          <h2 className="text-sm font-semibold text-foreground mb-3">{t('charts.payerBreakdown')}</h2>
          {noData ? (
            <p className="text-sm text-muted-foreground">{t('charts.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={payerData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
                <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]}>
                  {payerData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment type */}
        <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
          <h2 className="text-sm font-semibold text-foreground mb-3">{t('charts.paymentType')}</h2>
          {noData ? (
            <p className="text-sm text-muted-foreground">{t('charts.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentTypeData} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip formatter={(v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
                <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]}>
                  {paymentTypeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6-month trend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">{t('charts.trend')}</h2>
        {trendData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('charts.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
              <Bar dataKey="total" fill={SERIES.groups} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
