import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { getGroupTrend } from '@/api/shares';
import type { MonthTrendPoint } from '@/api/shares';

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899',
  '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16',
];

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

  useEffect(() => {
    getGroupTrend(groupId, 6).then(setTrend);
  }, [groupId]);

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
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {payerData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]}>
                  {paymentTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
