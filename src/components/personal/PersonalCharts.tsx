import { useTranslation } from 'react-i18next';
import { BarChart2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CategoryBarList } from '@/components/charts/CategoryBarList';
import { CHART_COLORS, SERIES } from '@/constants/chartColors';
import type { PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';

interface PersonalChartsProps {
  ledger: PersonalLedgerResponse;
  prevLedger: PersonalLedgerResponse | null;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  hiddenCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  trendRange: 3|6|12;
  onTrendRangeChange: (r: 3|6|12) => void;
  trendData: {label: string, income: number, personal: number, groups: number}[];
  trendLoading: boolean;
}

export function PersonalCharts({ ledger, prevLedger, year, month, categories, hiddenCategories, onToggleCategory, trendRange, onTrendRangeChange, trendData, trendLoading }: PersonalChartsProps) {
  const { t } = useTranslation();

  const catMap: Record<string, number> = {};
  for (const e of (ledger.personalExpenses ?? [])) {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
  }
  for (const e of (ledger.recurringPersonalExpenses ?? [])) {
    catMap[e.categoryName] = (catMap[e.categoryName] ?? 0) + e.amount;
  }
  const allCategories = Object.keys(catMap);
  const catData = Object.entries(catMap)
    .filter(([name]) => !hiddenCategories.has(name))
    .map(([name, value]) => ({ name, value }));

  const groupMap: Record<string, number> = {};
  for (const s of (ledger.mirroredShares ?? [])) {
    groupMap[s.sourceGroupName] = (groupMap[s.sourceGroupName] ?? 0) + s.shareAmount;
  }
  const groupData = Object.entries(groupMap).map(([name, value]) => ({ name, value }));

  const dayMap: Record<string, number> = {};
  for (const e of (ledger.personalExpenses ?? [])) {
    dayMap[e.date] = (dayMap[e.date] ?? 0) + e.amount;
  }
  for (const s of (ledger.mirroredShares ?? [])) {
    dayMap[s.date] = (dayMap[s.date] ?? 0) + s.shareAmount;
  }
  const prevDayMap: Record<string, number> = {};
  if (prevLedger) {
    for (const e of (prevLedger.personalExpenses ?? [])) {
      prevDayMap[e.date] = (prevDayMap[e.date] ?? 0) + e.amount;
    }
    for (const s of (prevLedger.mirroredShares ?? [])) {
      prevDayMap[s.date] = (prevDayMap[s.date] ?? 0) + s.shareAmount;
    }
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevDaysInMonth = new Date(prevYear, prevMonthNum, 0).getDate();
  // For the current month, stop at today so there's no empty future tail; the
  // last-month line is trimmed to the same day for a fair "same point in the
  // month" comparison. Past months always show the full month.
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const cap = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  let running = 0, prevRunning = 0;
  const cumulativeData: {day: string; total: number | null; prev: number | null}[] = [];
  for (let i = 1; i <= cap; i++) {
    running += dayMap[`${year}-${pad(month)}-${pad(i)}`] ?? 0;
    if (prevLedger && i <= prevDaysInMonth) prevRunning += prevDayMap[`${prevYear}-${pad(prevMonthNum)}-${pad(i)}`] ?? 0;
    cumulativeData.push({
      day: String(i),
      total: running,
      prev: (prevLedger && i <= prevDaysInMonth) ? prevRunning : null,
    });
  }

  const noData = ledger.totalIncome === 0 && ledger.totalPersonalExpenses === 0 && ledger.mirroredShares.length === 0;
  if (noData) return null;

  const fmt = (v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 0 });

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-6 overflow-x-hidden">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <BarChart2 className="h-4 w-4 text-brand" /> {t('charts.title')}
      </h2>

      {/* Monthly trend bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{t('charts.monthlyTrend')}</p>
          <div className="inline-flex rounded-full bg-muted p-0.5 gap-0.5">
            {([3, 6, 12] as const).map(r => (
              <button key={r} type="button" onClick={() => onTrendRangeChange(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  trendRange === r ? 'bg-card shadow-sm text-brand' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {r}m
              </button>
            ))}
          </div>
        </div>
        {trendLoading ? (
          <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">{t('common.loading')}</div>
        ) : trendData.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('charts.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="groups" name={t('charts.groups')} fill={SERIES.groups} stackId="stack" />
              <Bar dataKey="personal" name={t('charts.personal')} fill={SERIES.personal} stackId="stack" />
              <Bar dataKey="income" name={t('charts.income')} fill={SERIES.income} stackId="stack" radius={[3,3,0,0]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown + group contribution side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">{t('charts.categoryBreakdown')}</p>
          {catData.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('charts.noData')}</p>
          ) : (
            <>
              <CategoryBarList
                items={catData.map(d => ({ ...d, emoji: categories.find(c => c.name === d.name)?.emoji }))}
                formatValue={fmt}
              />
              <div className="flex flex-wrap gap-1 mt-3">
                {allCategories.map(cat => (
                  <button key={cat} type="button" onClick={() => onToggleCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      hiddenCategories.has(cat)
                        ? 'border-border text-muted-foreground bg-transparent'
                        : 'border-brand/40 text-brand bg-brand/5'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {groupData.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('charts.groupContribution')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={groupData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} dataKey="value">
                  {groupData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cumulative spend this month */}
      {cumulativeData.some(p => (p.total ?? 0) > 0 || (p.prev ?? 0) > 0) && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{t('charts.cumulativeSpend')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cumulativeData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={cumulativeData.length > 10 ? Math.floor(cumulativeData.length / 6) : 0} />
              <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={fmt} />
              <Tooltip formatter={(v: number | null) => v != null ? fmt(v) : '—'} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="total" stroke={SERIES.thisMonth} strokeWidth={2} dot={false} name={t('charts.thisMonth')} connectNulls={false} />
              {prevLedger && <Line type="monotone" dataKey="prev" stroke={SERIES.lastMonth} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name={t('charts.lastMonth')} connectNulls={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
