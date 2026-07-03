import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, ExternalLink, Plus, Pencil, Trash2, Repeat, BarChart2 } from 'lucide-react';
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
import { useIsland } from '@/contexts/IslandContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { useScroll } from '@/contexts/ScrollContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { useCategories } from '@/hooks/useCategories';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/utils/format';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { ExpenseDetailDialog } from '@/components/expenses/ExpenseDetailDialog';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import {
  createRecurringIncome,
  createVariableIncome,
  updateRecurringIncome,
  updateVariableIncome,
  deleteRecurringIncome,
  deleteVariableIncome,
  getPersonalGroup,
  createRecurringPersonalExpense,
  updateRecurringPersonalExpense,
  deleteRecurringPersonalExpense,
  getPersonalLedger,
} from '@/api/personal';
import { updateExpense, deleteExpense, checkSimilarExpenses } from '@/api/expenses';
import { getCurrentUser } from '@/api/auth';
import type { ExpenseResponse, ExpenseCreate, IncomeInstanceResponse, RecurringPersonalExpenseInstanceResponse, MirroredShareItem, PersonalLedgerResponse } from '@/types/expense';
import { DialogFooter } from '@/components/ui/dialog';

const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16'];

interface PersonalChartsProps {
  ledger: PersonalLedgerResponse;
  prevLedger: PersonalLedgerResponse | null;
  year: number;
  month: number;
  hiddenCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  trendRange: 3|6|12;
  onTrendRangeChange: (r: 3|6|12) => void;
  trendData: {label: string, income: number, personal: number, groups: number}[];
  trendLoading: boolean;
}

function PersonalCharts({ ledger, prevLedger, year, month, hiddenCategories, onToggleCategory, trendRange, onTrendRangeChange, trendData, trendLoading }: PersonalChartsProps) {
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
  const totalDays = Math.max(daysInMonth, prevLedger ? prevDaysInMonth : 0);
  let running = 0, prevRunning = 0;
  const cumulativeData: {day: string; total: number | null; prev: number | null}[] = [];
  for (let i = 1; i <= totalDays; i++) {
    if (i <= daysInMonth) running += dayMap[`${year}-${pad(month)}-${pad(i)}`] ?? 0;
    if (prevLedger && i <= prevDaysInMonth) prevRunning += prevDayMap[`${prevYear}-${pad(prevMonthNum)}-${pad(i)}`] ?? 0;
    cumulativeData.push({
      day: String(i),
      total: i <= daysInMonth ? running : null,
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
          <p className="text-xs text-muted-foreground">Monthly trend</p>
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
          <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
        ) : trendData.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('charts.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="groups" name="Groups" fill="#6366f1" stackId="stack" />
              <Bar dataKey="personal" name="Personal" fill="#f97316" stackId="stack" />
              <Bar dataKey="income" name={t('charts.income')} fill="#22c55e" stackId="stack" radius={[3,3,0,0]} />
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
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1 mt-1">
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
            <p className="text-xs text-muted-foreground mb-2">Group contribution</p>
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
          <p className="text-xs text-muted-foreground mb-2">Cumulative spend this month</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cumulativeData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={fmt} />
              <Tooltip formatter={(v: number | null) => v != null ? fmt(v) : '—'} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} name="This month" connectNulls={false} />
              {prevLedger && <Line type="monotone" dataKey="prev" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Last month" connectNulls={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface BudgetBarProps {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  projectedBalance: number;
  pendingSettlementsTotal: number;
  formatAmt: (n: number) => string;
}

function BudgetBar({ totalIncome, totalExpenses, currentBalance, projectedBalance, pendingSettlementsTotal, formatAmt }: BudgetBarProps) {
  const { t } = useTranslation();
  if (totalIncome <= 0.01) return null;

  const expensePct = Math.min((totalExpenses / totalIncome) * 100, 100);
  const isOverspent = totalExpenses > totalIncome;
  const savingsRate = isOverspent ? 0 : Math.round((currentBalance / totalIncome) * 100);
  const hasPending = Math.abs(pendingSettlementsTotal) > 0.01;
  // Position the projected indicator within the green (savings) zone, not as a raw % of income.
  // projectedBalance is reduced by group payer payments while the bar's red zone only shows
  // personal expenses — using totalIncome as denominator would push the indicator into the red zone
  // or off the left edge. Instead, map projectedBalance onto [0, savingsAmount] so the indicator
  // stays inside the green zone: left edge = all savings consumed, right edge = full savings kept.
  const savingsAmount = totalIncome - totalExpenses;
  const greenWidth = 100 - expensePct;
  const projectedPct = savingsAmount > 0.01 && greenWidth > 0.01
    ? expensePct + Math.max(0, Math.min(projectedBalance / savingsAmount, 1)) * greenWidth
    : expensePct;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{t('personal.budgetBar')}</p>
        <p className={cn(
          'text-sm font-bold',
          isOverspent ? 'text-red-500' : savingsRate >= 30 ? 'text-emerald-600' : savingsRate > 0 ? 'text-amber-500' : 'text-red-500',
        )}>
          {isOverspent ? t('personal.overBudget') : t('personal.savingsRate', { rate: savingsRate })}
        </p>
      </div>

      {/* Bar */}
      <div className="relative h-3.5">
        {/* Track */}
        <div className="absolute inset-0 rounded-full bg-muted" />
        {/* Expense fill */}
        {expensePct > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-rose-400 dark:bg-rose-500 rounded-l-full transition-[width] duration-700 ease-out"
            style={{ width: `${expensePct}%`, borderRadius: expensePct >= 100 ? '9999px' : undefined }}
          />
        )}
        {/* Balance fill */}
        {!isOverspent && expensePct < 100 && (
          <div
            className="absolute top-0 h-full bg-emerald-400 dark:bg-emerald-500 rounded-r-full transition-all duration-700 ease-out"
            style={{ left: `${expensePct}%`, right: 0, borderRadius: expensePct <= 0 ? '9999px' : undefined }}
          />
        )}
        {/* Projected balance indicator: downward triangle above bar + contrasting line through it */}
        {hasPending && (
          <>
            <div
              className="absolute -top-2.5 z-20 -translate-x-1/2 pointer-events-none select-none transition-[left] duration-700 ease-out"
              style={{ left: `${projectedPct}%` }}
            >
              <svg width="9" height="5" viewBox="0 0 9 5" aria-hidden="true" className="fill-foreground/50 dark:fill-foreground/40 drop-shadow-sm">
                <path d="M0 0 L9 0 L4.5 5 Z" />
              </svg>
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-[2px] h-5 bg-foreground/60 dark:bg-foreground/50 rounded-full z-10 transition-[left] duration-700 ease-out"
              style={{ left: `calc(${projectedPct}% - 1px)` }}
              title={`${t('personal.projectedTick')}: ${formatAmt(projectedBalance)}`}
            />
          </>
        )}
      </div>

      {/* Labels */}
      <div className="flex items-end justify-between text-xs">
        <div className="space-y-0.5">
          <p className="font-semibold text-rose-500 dark:text-rose-400 tabular-nums">{formatAmt(totalExpenses)}</p>
          <p className="text-muted-foreground">{t('personal.totalExpenses')}</p>
        </div>
        {hasPending && (
          <div className="text-center space-y-0.5">
            <p className="font-semibold text-foreground/60 tabular-nums text-[11px]">{formatAmt(projectedBalance)}</p>
            <p className="text-muted-foreground text-[10px]">{t('personal.projectedTick')}</p>
          </div>
        )}
        <div className="text-right space-y-0.5">
          <p className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatAmt(totalIncome)}</p>
          <p className="text-muted-foreground">{t('personal.totalIncome')}</p>
        </div>
      </div>
    </div>
  );
}

export function PersonalDashboard() {
  const { t } = useTranslation();
  const island = useIsland();
  const { registerPersonalAdd } = useFabActions();
  const { notifyScroll } = useScroll();
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    notifyScroll((e.target as HTMLDivElement).scrollTop);
  }, [notifyScroll]);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const { data: ledger, isLoading, refetch } = usePersonalLedger(year, month);
  const { data: categories } = useCategories();
  const { displayMode, setDisplayMode, blueRate, formatAmount } = useCurrency();

  // Personal group + current member
  const [personalGroupId, setPersonalGroupId] = useState<number | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);

  useEffect(() => {
    getPersonalGroup().then(g => setPersonalGroupId(g.id)).catch(() => {});
    getCurrentUser().then(u => setCurrentMemberId(u.id)).catch(() => {});
  }, []);

  // Income form state — null=hidden, 'recurring'=salary form, 'variable'=one-off form, 'pick'=type picker
  const [incomeForm, setIncomeForm] = useState<'pick' | 'recurring' | 'variable' | null>(null);
  const [incomeLabel, setIncomeLabel] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCurrency, setIncomeCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [savingIncome, setSavingIncome] = useState(false);

  // Income edit state
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [editIncomeLabel, setEditIncomeLabel] = useState('');
  const [editIncomeAmount, setEditIncomeAmount] = useState('');
  const [savingEditIncome, setSavingEditIncome] = useState(false);

  // Personal expense dialog — shared for create and edit
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);

  // Register the personal-add action with the global FAB so it can open this dialog
  const openPersonalAdd = useCallback(() => {
    setEditingExpense(null);
    setShowExpenseDialog(true);
  }, []);
  useEffect(() => {
    registerPersonalAdd(openPersonalAdd);
    return () => registerPersonalAdd(null);
  }, [registerPersonalAdd, openPersonalAdd]);

  // Recurring expense add form
  const [showRecurringExpForm, setShowRecurringExpForm] = useState(false);
  const [recExpLabel, setRecExpLabel] = useState('');
  const [recExpAmount, setRecExpAmount] = useState('');
  const [recExpCategory, setRecExpCategory] = useState('');
  const [recExpCurrency, setRecExpCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [savingRecExp, setSavingRecExp] = useState(false);

  // Recurring expense edit state
  const [editingRecExpId, setEditingRecExpId] = useState<number | null>(null);
  const [editRecExpLabel, setEditRecExpLabel] = useState('');
  const [editRecExpAmount, setEditRecExpAmount] = useState('');
  const [editRecExpCategory, setEditRecExpCategory] = useState('');
  const [savingEditRecExp, setSavingEditRecExp] = useState(false);
  const [selectedRecurringInstance, setSelectedRecurringInstance] = useState<RecurringPersonalExpenseInstanceResponse | null>(null);
  const [selectedMirroredShare, setSelectedMirroredShare] = useState<MirroredShareItem | null>(null);

  // Confirmation dialog state — replaces window.confirm()
  const [confirm, setConfirm] = useState<{ title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void } | null>(null);

  // Duplicate expense detection
  const [pendingExpenseData, setPendingExpenseData] = useState<ExpenseCreate | null>(null);
  const [expenseDuplicates, setExpenseDuplicates] = useState<ExpenseResponse[]>([]);

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

  useEffect(() => {
    setTrendLoading(true);
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pts: {year: number, month: number}[] = [];
    let y = year, m = month;
    for (let i = 0; i < trendRange; i++) {
      pts.unshift({ year: y, month: m });
      if (--m === 0) { m = 12; y--; }
    }
    Promise.all(pts.map(p => getPersonalLedger(p.year, p.month)))
      .then(results => {
        setTrendData(results.map((r, i) => ({
          label: pts[i].year !== year
            ? `${MONTHS[pts[i].month - 1]} '${String(pts[i].year).slice(2)}`
            : MONTHS[pts[i].month - 1],
          income: r.totalIncome,
          personal: r.totalPersonalExpenses,
          groups: r.mirroredShares.reduce((s, sh) => s + sh.shareAmount, 0),
        })));
      })
      .catch(() => {})
      .finally(() => setTrendLoading(false));
  }, [year, month, trendRange, chartKey]);

  // Keep recExpCategory in sync when categories load
  useEffect(() => {
    if (categories.length > 0 && !recExpCategory) {
      setRecExpCategory(categories[0].name);
    }
  }, [categories, recExpCategory]);

  const handleNavigate = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const doSaveIncome = async () => {
    if (!incomeLabel || !incomeAmount || !incomeForm || incomeForm === 'pick') return;
    setSavingIncome(true);
    try {
      if (incomeForm === 'recurring') {
        await createRecurringIncome({ label: incomeLabel, amount: parseFloat(incomeAmount), startYear: year, startMonth: month, currency: incomeCurrency });
      } else {
        await createVariableIncome({ year, month, label: incomeLabel, amount: parseFloat(incomeAmount), currency: incomeCurrency });
      }
      toast.success(t('toasts.expenseAdded'));
      setIncomeForm(null);
      setIncomeLabel('');
      setIncomeAmount('');
      setIncomeCurrency('ARS');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingIncome(false);
    }
  };

  const handleSaveIncome = async () => {
    if (!incomeLabel || !incomeAmount || !incomeForm || incomeForm === 'pick') return;
    const amt = parseFloat(incomeAmount);
    const isDuplicate = ledger?.incomes.some(
      i => Math.abs(i.amount - amt) < 0.01 && i.label.trim().toLowerCase() === incomeLabel.trim().toLowerCase()
    );
    if (isDuplicate) {
      setConfirm({
        title: t('expenses.duplicateTitle'),
        description: t('expenses.duplicateDesc') + ' ' + t('expenses.addAnywayQuestion'),
        confirmLabel: t('expenses.addAnyway'),
        destructive: false,
        onConfirm: async () => { setConfirm(null); await doSaveIncome(); },
      });
      return;
    }
    await doSaveIncome();
  };

  const handleSaveEditIncome = async (income: IncomeInstanceResponse) => {
    if (!editIncomeLabel || !editIncomeAmount) return;
    setSavingEditIncome(true);
    try {
      if (income.source === 'recurring' && income.recurringIncomeId) {
        await updateRecurringIncome(income.recurringIncomeId, {
          label: editIncomeLabel,
          amount: parseFloat(editIncomeAmount),
        }, year, month);
      } else {
        await updateVariableIncome(income.id, {
          label: editIncomeLabel,
          amount: parseFloat(editIncomeAmount),
        });
      }
      toast.success(t('toasts.expenseUpdated'));
      setEditingIncomeId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingEditIncome(false);
    }
  };

  const handleDeleteIncome = (income: IncomeInstanceResponse) => {
    setConfirm({
      title: t('personal.deleteIncomeTitle'),
      description: t('personal.deleteIncomeDesc'),
      onConfirm: async () => {
        setConfirm(null);
        try {
          if (income.source === 'recurring' && income.recurringIncomeId) {
            await deleteRecurringIncome(income.recurringIncomeId, year, month);
          } else {
            await deleteVariableIncome(income.id);
          }
          toast.success(t('toasts.expenseDeleted'));
          refetch();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete');
        }
      },
    });
  };

  const doSaveRecurringExpense = async () => {
    if (!recExpLabel || !recExpAmount || !recExpCategory) return;
    setSavingRecExp(true);
    try {
      await createRecurringPersonalExpense({
        label: recExpLabel,
        amount: parseFloat(recExpAmount),
        categoryName: recExpCategory,
        startYear: year,
        startMonth: month,
        currency: recExpCurrency,
      });
      toast.success(t('toasts.expenseAdded'));
      setShowRecurringExpForm(false);
      setRecExpLabel(''); setRecExpAmount(''); setRecExpCategory(categories[0]?.name ?? ''); setRecExpCurrency('ARS');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingRecExp(false);
    }
  };

  const handleSaveRecurringExpense = async () => {
    if (!recExpLabel || !recExpAmount || !recExpCategory) return;
    const amt = parseFloat(recExpAmount);
    const isDuplicate = ledger?.recurringPersonalExpenses.some(
      i => Math.abs(i.amount - amt) < 0.01 && i.label.trim().toLowerCase() === recExpLabel.trim().toLowerCase()
    );
    if (isDuplicate) {
      setConfirm({
        title: t('expenses.duplicateTitle'),
        description: t('expenses.duplicateDesc') + ' ' + t('expenses.addAnywayQuestion'),
        confirmLabel: t('expenses.addAnyway'),
        destructive: false,
        onConfirm: async () => { setConfirm(null); await doSaveRecurringExpense(); },
      });
      return;
    }
    await doSaveRecurringExpense();
  };

  const handleSaveEditRecurringExpense = async (instance: RecurringPersonalExpenseInstanceResponse) => {
    if (!editRecExpLabel || !editRecExpAmount) return;
    setSavingEditRecExp(true);
    try {
      await updateRecurringPersonalExpense(instance.recurringExpenseId, {
        label: editRecExpLabel,
        amount: parseFloat(editRecExpAmount),
        categoryName: editRecExpCategory || instance.categoryName,
      }, year, month);
      toast.success(t('toasts.expenseUpdated'));
      setEditingRecExpId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingEditRecExp(false);
    }
  };

  const handleDeleteRecurringExpense = (instance: RecurringPersonalExpenseInstanceResponse) => {
    setConfirm({
      title: t('personal.deleteRecurringTitle'),
      description: t('personal.deleteRecurringDesc'),
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteRecurringPersonalExpense(instance.recurringExpenseId, year, month);
          toast.success(t('toasts.expenseDeleted'));
          refetch();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete');
        }
      },
    });
  };

  const doCreatePersonalExpense = async (data: ExpenseCreate) => {
    if (!personalGroupId || !currentMemberId) return;
    const { createExpense } = await import('@/api/expenses');
    const result = await createExpense(personalGroupId, { ...data, payerId: currentMemberId, splitStrategy: { type: 'equal' } });
    if (result.error) { toast.error(result.error); return; }
    toast.success(t('toasts.expenseAdded'));
    setPendingExpenseData(null);
    setExpenseDuplicates([]);
    setShowExpenseDialog(false);
    setEditingExpense(null);
    refetch();
    island.success();
  };

  const handleSubmitExpense = async (data: ExpenseCreate) => {
    if (!personalGroupId || !currentMemberId) return;
    if (editingExpense) {
      const id = editingExpense.parentExpenseId ?? editingExpense.id;
      const { error } = await updateExpense(personalGroupId, id, data);
      if (error) { toast.error(error); return; }
      toast.success(t('toasts.expenseUpdated'));
      setShowExpenseDialog(false);
      setEditingExpense(null);
      refetch();
      island.success();
      return;
    }
    const [y, m] = data.date.split('-').map(Number);
    const { data: similar } = await checkSimilarExpenses(personalGroupId, y, m, data.amount, data.description, data.date);
    if (similar && similar.length > 0) {
      setPendingExpenseData(data);
      setExpenseDuplicates(similar);
      return;
    }
    await doCreatePersonalExpense(data);
  };

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
        <MonthPicker year={year} month={month} onNavigate={handleNavigate} />
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
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">

      {/* LEFT COLUMN: income + personal expenses */}
      <div className="space-y-5">

      {/* Income section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-600" />{t('personal.income')}
            </h2>
            {blueRate !== null && ledger?.incomes.some(i => i.currency === 'USD') && (
              <button
                type="button"
                onClick={() => setDisplayMode(displayMode === 'original' ? 'ars' : 'original')}
                className={cn(
                  'h-6 px-2 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0',
                  displayMode === 'ars'
                    ? 'bg-brand/20 text-brand hover:bg-brand/30'
                    : 'text-muted-foreground border border-border hover:bg-accent hover:text-foreground',
                )}
              >
                {displayMode === 'ars' ? t('expenses.viewOriginal') : t('expenses.viewInARS')}
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIncomeForm(f => f ? null : 'pick')}>
            <Plus className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">{t('personal.add')}</span>
          </Button>
        </div>

        {/* Step 1: pick type */}
        {incomeForm === 'pick' && (
          <div className="mb-3 p-3 bg-muted/40 rounded-lg space-y-1.5">
            <button onClick={() => setIncomeForm('recurring')}
              className="w-full text-left px-3 py-2.5 rounded-md border border-border bg-background hover:border-brand/50 hover:bg-accent/50 transition-colors">
              <p className="text-sm font-medium text-foreground">{t('personal.recurringTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('personal.recurringDesc')}</p>
            </button>
            <button onClick={() => setIncomeForm('variable')}
              className="w-full text-left px-3 py-2.5 rounded-md border border-border bg-background hover:border-brand/50 hover:bg-accent/50 transition-colors">
              <p className="text-sm font-medium text-foreground">{t('personal.variableTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('personal.variableDesc')}</p>
            </button>
            <div className="flex justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setIncomeForm(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}

        {/* Step 2: fill in details */}
        {(incomeForm === 'recurring' || incomeForm === 'variable') && (
          <div className="mb-3 p-3 bg-muted/40 rounded-lg space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {incomeForm === 'recurring' ? t('personal.recurringTitle') : t('personal.variableTitle')}
            </p>
            <Input
              placeholder={t('personal.salaryLabel')} value={incomeLabel} onChange={e => setIncomeLabel(e.target.value)} />
            <div className="flex gap-2 items-center">
              <Input
                className="flex-1"
                type="number" placeholder={t('personal.salaryAmount')} value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
              <CurrencyToggle value={incomeCurrency} onChange={setIncomeCurrency} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setIncomeForm('pick'); setIncomeLabel(''); setIncomeAmount(''); setIncomeCurrency('ARS'); }}>
                ← Back
              </Button>
              <Button size="sm" disabled={savingIncome} onClick={handleSaveIncome}
                className="bg-brand hover:bg-brand/90 text-white">
                {savingIncome ? t('common.loading') : t('personal.saveSalary')}
              </Button>
            </div>
          </div>
        )}

        {/* Income list */}
        {ledger && ledger.incomes.length === 0 && !incomeForm ? (
          <p className="text-sm text-muted-foreground">{t('personal.noIncome')}</p>
        ) : (
          <div className="space-y-1.5">
            {ledger?.incomes.map(income => (
              <div key={income.id} className="group">
                <div className="flex items-center justify-between py-1.5 text-sm gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${income.source === 'recurring' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {income.source === 'recurring' ? t('personal.recurringBadge') : t('personal.variableBadge')}
                    </span>
                    <span className="text-foreground truncate">{income.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {income.currency === 'USD' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">USD</span>
                    )}
                    <span className="font-semibold text-green-600 tabular-nums w-24 text-right">{formatAmount(income.amount, income.currency)}</span>
                  </div>
                  <div className="[@media(hover:none)]:hidden flex items-center gap-1 opacity-0 invisible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:visible transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setEditingIncomeId(income.id); setEditIncomeLabel(income.label); setEditIncomeAmount(String(income.amount)); }}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleDeleteIncome(income)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {editingIncomeId === income.id && (
                  <div className="mt-1 mb-2 p-2 bg-muted/40 rounded-md space-y-1.5">
                    <Input
                      value={editIncomeLabel}
                      onChange={e => setEditIncomeLabel(e.target.value)} />
                    <Input
                      type="number"
                      value={editIncomeAmount}
                      onChange={e => setEditIncomeAmount(e.target.value)} />
                    <div className="flex gap-1.5 justify-end">
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setEditingIncomeId(null)}>{t('common.cancel')}</Button>
                      <Button size="sm" className="h-6 text-xs px-2 bg-brand hover:bg-brand/90 text-white"
                        disabled={savingEditIncome} onClick={() => handleSaveEditIncome(income)}>
                        {savingEditIncome ? '…' : t('common.save')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Expenses Section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-red-500" /> {t('personal.personalExpenses')}
            </h2>
            {blueRate !== null && (ledger?.personalExpenses.some(e => e.currency === 'USD') || ledger?.recurringPersonalExpenses.some(i => i.currency === 'USD')) && (
              <button
                type="button"
                onClick={() => setDisplayMode(displayMode === 'original' ? 'ars' : 'original')}
                className={cn(
                  'h-6 px-2 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0',
                  displayMode === 'ars'
                    ? 'bg-brand/20 text-brand hover:bg-brand/30'
                    : 'text-muted-foreground border border-border hover:bg-accent hover:text-foreground',
                )}
              >
                {displayMode === 'ars' ? t('expenses.viewOriginal') : t('expenses.viewInARS')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditingExpense(null); setShowExpenseDialog(true); }}>
              <Plus className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">{t('expenses.add')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRecurringExpForm(v => !v)}>
              <Repeat className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">{t('personal.addRecurringExpense')}</span>
            </Button>
          </div>
        </div>


        {showRecurringExpForm && personalGroupId && (
          <div className="mb-3 p-3 bg-muted/40 rounded-lg space-y-2 text-sm">
            <p className="text-xs text-muted-foreground font-medium">{t('personal.recurringExpenseTitle')}</p>
            <Input placeholder={t('expenseForm.description')} value={recExpLabel} onChange={e => setRecExpLabel(e.target.value)} />
            <div className="flex gap-2 items-center">
              <Input type="number" placeholder={t('expenseForm.amount')} value={recExpAmount} onChange={e => setRecExpAmount(e.target.value)} className="flex-1" />
              <CurrencyToggle value={recExpCurrency} onChange={setRecExpCurrency} />
            </div>
            <Select value={recExpCategory} onValueChange={setRecExpCategory}>
              <SelectTrigger className="w-full">
                <span className="flex-1 text-left text-sm">
                  {categories.find(c => c.name === recExpCategory)
                    ? `${categories.find(c => c.name === recExpCategory)!.emoji} ${recExpCategory}`
                    : recExpCategory}
                </span>
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowRecurringExpForm(false)}>{t('common.cancel')}</Button>
              <Button size="sm" disabled={savingRecExp} onClick={handleSaveRecurringExpense}
                className="bg-brand hover:bg-brand/90 text-white">
                {savingRecExp ? t('common.loading') : t('personal.saveSalary')}
              </Button>
            </div>
          </div>
        )}

        {ledger && ledger.personalExpenses.length === 0 && ledger.recurringPersonalExpenses.length === 0  ? (
          <p className="text-sm text-muted-foreground">{t('expenses.noExpenses')}</p>
        ) : (
          <div className="-mx-4">
            {/* Recurring personal expenses for this month */}
            {ledger?.recurringPersonalExpenses.map(instance => {
              const catEmoji = categories.find(c => c.name === instance.categoryName)?.emoji;
              return (
              <div key={`rec-exp-${instance.id}`} className="border-b border-border/50 last:border-0">
                <div
                  className="flex items-center gap-3 px-4 py-3 group [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors cursor-pointer touch-manipulation"
                  onClick={() => setSelectedRecurringInstance(instance)}
                >
                  {/* Category icon — matches ExpenseRow */}
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {catEmoji
                      ? <span className="text-lg leading-none">{catEmoji}</span>
                      : <span className="text-xs font-bold text-muted-foreground uppercase">{instance.categoryName.slice(0, 2)}</span>
                    }
                  </div>
                  {/* Label + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{instance.label}</p>
                    <p className="text-xs text-muted-foreground">↺ {t('personal.addRecurringExpense')}</p>
                    {/* Mobile badges */}
                    <div className="flex sm:hidden items-center gap-1 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        {t('personal.addRecurringExpense')}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {instance.categoryName}
                      </span>
                    </div>
                  </div>
                  {/* Desktop badges */}
                  <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      {t('personal.addRecurringExpense')}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {instance.categoryName}
                    </span>
                  </div>
                  {/* Amount — separate child so gap-3 spacing matches ExpenseRow */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {instance.currency === 'USD' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">USD</span>
                    )}
                    <span className="text-sm font-semibold text-foreground tabular-nums w-24 text-right">{formatAmount(instance.amount, instance.currency)}</span>
                  </div>
                  {/* Actions */}
                  <div
                    className="[@media(hover:none)]:hidden flex items-center gap-1 opacity-0 invisible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:visible transition-opacity flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setEditingRecExpId(instance.id); setEditRecExpLabel(instance.label); setEditRecExpAmount(String(instance.amount)); setEditRecExpCategory(instance.categoryName); }}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleDeleteRecurringExpense(instance)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {/* Inline edit form */}
                {editingRecExpId === instance.id && (
                  <div className="px-4 pb-3">
                    <div className="p-2 bg-muted/40 rounded-md space-y-1.5">
                      <Input
                        value={editRecExpLabel} onChange={e => setEditRecExpLabel(e.target.value)} />
                      <Input
                        type="number"
                        value={editRecExpAmount} onChange={e => setEditRecExpAmount(e.target.value)} />
                      <Select value={editRecExpCategory} onValueChange={setEditRecExpCategory}>
                        <SelectTrigger className="w-full h-7 text-xs">
                          <span className="flex-1 text-left">
                            {categories.find(c => c.name === editRecExpCategory)
                              ? `${categories.find(c => c.name === editRecExpCategory)!.emoji} ${editRecExpCategory}`
                              : editRecExpCategory}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1.5 justify-end">
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setEditingRecExpId(null)}>{t('common.cancel')}</Button>
                        <Button size="sm" className="h-6 text-xs px-2 bg-brand hover:bg-brand/90 text-white"
                          disabled={savingEditRecExp} onClick={() => handleSaveEditRecurringExpense(instance)}>
                          {savingEditRecExp ? '…' : t('common.save')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );})}
            {ledger?.personalExpenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                members={currentMemberId ? [{ id: currentMemberId, name: 'Me', telephone: '' }] : []}
                isSettled={false}
                hideSplitBadge
                onEdit={e => { setEditingExpense(e); setShowExpenseDialog(true); }}
                onDelete={e => {
                  const id = e.parentExpenseId ?? e.id;
                  setConfirm({
                    title: t('personal.deleteExpenseTitle'),
                    description: t('personal.deleteExpenseDesc'),
                    onConfirm: async () => {
                      setConfirm(null);
                      if (!personalGroupId) return;
                      const { success, error } = await deleteExpense(personalGroupId, id);
                      if (!success) { toast.error(error ?? t('toasts.failedDelete')); return; }
                      toast.success(t('toasts.expenseDeleted'));
                      refetch();
                    },
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      </div>{/* end left column (income + personal expenses) */}

      {/* RIGHT COLUMN: mirrored shares */}
      <div className="space-y-5">

      {/* Mirrored shares from shared groups */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-red-500" /> {t('personal.mirroredShares')}
          </h2>
        </div>
        {ledger && ledger.mirroredShares.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 pb-4">{t('personal.noShares')}</p>
        ) : (
          <div>
            {ledger?.mirroredShares.map(share => {
              const catEmoji = categories.find(c => c.name === share.category)?.emoji;
              const isPayer = share.payerAmount > 0;
              const pendingReceipt = isPayer ? share.payerAmount - share.shareAmount : 0;

              return (
                <div key={share.sourceExpenseId} className="border-b border-border/50 last:border-0">
                  {/* Header: status badge + group + link */}
                  <div className="flex items-center justify-between px-4 pt-2">
                    <div className="flex items-center gap-2">
                      {share.status === 'pending' ? (
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                          <Clock className="h-3 w-3" />{t('personal.pending')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />{t('personal.realized')}
                        </span>
                      )}
                      {share.installments > 1 && (
                        <span className="text-xs text-muted-foreground">{share.installmentNo}/{share.installments}</span>
                      )}
                    </div>
                    <Link
                      to={`/groups/${share.sourceGroupId}?year=${year}&month=${month}&highlight=${share.sourceExpenseId}`}
                      className="text-xs text-muted-foreground hover:text-brand transition-colors flex items-center gap-0.5"
                      title={t('personal.viewInGroup')}
                    >
                      {t('personal.viewInGroup')} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {isPayer ? (
                    /* Payer layout: show paid / pending receipt / net */
                    <div className="flex items-center gap-3 px-4 py-3 [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors cursor-pointer touch-manipulation" onClick={() => setSelectedMirroredShare(share)}>
                      {/* Category icon */}
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {catEmoji
                          ? <span className="text-lg leading-none">{catEmoji}</span>
                          : <span className="text-xs font-bold text-muted-foreground uppercase">{share.category.slice(0, 2)}</span>}
                      </div>
                      {/* Description + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{share.description}</p>
                        <p className="text-xs text-muted-foreground">{share.sourceGroupName} · {share.date}</p>
                        <div className="flex sm:hidden items-center gap-1 mt-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                        </div>
                      </div>
                      {/* Desktop category badge */}
                      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                      </div>
                      {/* Amounts: paid + pending receipt */}
                      <div className="text-right flex-shrink-0 w-28">
                        <p className="text-sm font-semibold text-foreground tabular-nums">-{formatCurrency(share.payerAmount)}</p>
                        <p className={`text-xs font-medium ${share.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                          {share.status === 'pending'
                            ? `+${formatCurrency(pendingReceipt)} ${t('personal.pending').toLowerCase()}`
                            : `+${formatCurrency(pendingReceipt)} ${t('personal.realized').toLowerCase()}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Non-payer layout */
                    <div className="flex items-center gap-3 px-4 py-3 [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors cursor-pointer touch-manipulation" onClick={() => setSelectedMirroredShare(share)}>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {catEmoji
                          ? <span className="text-lg leading-none">{catEmoji}</span>
                          : <span className="text-xs font-bold text-muted-foreground uppercase">{share.category.slice(0, 2)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{share.description}</p>
                        <p className="text-xs text-muted-foreground">{share.payerName} · {share.sourceGroupName}</p>
                        <div className="flex sm:hidden items-center gap-1 mt-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                      </div>
                      <div className="text-sm font-semibold text-foreground tabular-nums flex-shrink-0 w-24 text-right">
                        -{formatCurrency(share.shareAmount)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>{/* end right column */}
      </div>{/* end two-column grid */}

      {/* ── Analytics (full width) ──────────────────────────────── */}
      {ledger && (
        <PersonalCharts
          ledger={ledger}
          prevLedger={prevLedger}
          year={year}
          month={month}
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

      {/* Mirrored share detail popup */}
      {selectedMirroredShare && (() => {
        const s = selectedMirroredShare;
        const catEmoji = categories.find(c => c.name === s.category)?.emoji;
        const isPayer = s.payerAmount > 0;
        const pendingReceipt = isPayer ? s.payerAmount - s.shareAmount : 0;
        return (
          <Dialog open onOpenChange={open => { if (!open) setSelectedMirroredShare(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {catEmoji
                      ? <span className="text-2xl leading-none">{catEmoji}</span>
                      : <span className="text-sm font-bold text-muted-foreground uppercase">{s.category.slice(0, 2)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base leading-tight flex items-center gap-1.5">
                      {s.description}
                      {s.isRecurring && <Repeat className="h-3.5 w-3.5 text-brand shrink-0" />}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.category} · {formatDate(s.date, true)}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg px-4 py-3 mt-1 space-y-1">
                  {isPayer ? (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('personal.paid', { defaultValue: 'Paid' })}</span>
                        <span className="text-xl font-bold text-foreground tabular-nums">-{formatCurrency(s.payerAmount)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('personal.myShare', { defaultValue: 'My share' })}</span>
                        <span className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(s.shareAmount)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('personal.toReceive', { defaultValue: 'To receive' })}</span>
                        <span className={`text-sm font-semibold tabular-nums ${s.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                          +{formatCurrency(pendingReceipt)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">{t('personal.myShare', { defaultValue: 'My share' })}</span>
                      <span className="text-xl font-bold text-foreground tabular-nums">-{formatCurrency(s.shareAmount)}</span>
                    </div>
                  )}
                </div>
              </DialogHeader>
              <div className="px-1 divide-y divide-border/50">
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('expenses.payer', { defaultValue: 'Payer' })}</span>
                  <span className="text-xs text-foreground">{s.payerName}</span>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('personal.group', { defaultValue: 'Group' })}</span>
                  <span className="text-xs text-foreground">{s.sourceGroupName}</span>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('personal.status', { defaultValue: 'Status' })}</span>
                  <span className={`text-xs font-medium ${s.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                    {s.status === 'pending' ? t('personal.pending') : t('personal.realized')}
                  </span>
                </div>
                {s.installments > 1 && (
                  <div className="flex items-start gap-3 py-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('expenses.installment', { defaultValue: 'Instalment' })}</span>

                    <span className="text-xs text-foreground">{s.installmentNo} / {s.installments}</span>
                  </div>
                )}
              </div>
              <div className="pt-1">
                <Link
                  to={`/groups/${s.sourceGroupId}?year=${year}&month=${month}&highlight=${s.sourceExpenseId}`}
                  onClick={() => setSelectedMirroredShare(null)}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-brand hover:text-brand/80 transition-colors py-2 rounded-md hover:bg-muted/50"
                >
                  {t('personal.viewInGroup')} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Recurring personal expense detail popup */}
      {selectedRecurringInstance && currentMemberId && (
        <ExpenseDetailDialog
          open={!!selectedRecurringInstance}
          onOpenChange={open => { if (!open) setSelectedRecurringInstance(null); }}
          expense={{
            id: selectedRecurringInstance.id,
            description: selectedRecurringInstance.label,
            amount: selectedRecurringInstance.amount,
            date: `${selectedRecurringInstance.year}-${String(selectedRecurringInstance.month).padStart(2, '0')}-01`,
            category: selectedRecurringInstance.categoryName,
            payerId: currentMemberId,
            paymentType: 'debit',
            installments: 1,
            installmentNo: 1,
            splitStrategy: { type: 'equal' },
            recurringTemplateId: selectedRecurringInstance.recurringExpenseId,
          }}
          members={[{ id: currentMemberId, name: 'Me', telephone: '' }]}
          isSettled={false}
          hideSplitBadge
          onEdit={() => {
            setSelectedRecurringInstance(null);
            setEditingRecExpId(selectedRecurringInstance.id);
            setEditRecExpLabel(selectedRecurringInstance.label);
            setEditRecExpAmount(String(selectedRecurringInstance.amount));
            setEditRecExpCategory(selectedRecurringInstance.categoryName);
          }}
          onDelete={() => {
            setSelectedRecurringInstance(null);
            handleDeleteRecurringExpense(selectedRecurringInstance);
          }}
        />
      )}

      {/* Add / Edit expense dialog */}
      {showExpenseDialog && personalGroupId && currentMemberId && (
        <AddExpenseDialog
          open={showExpenseDialog}
          onOpenChange={open => { setShowExpenseDialog(open); if (!open) setEditingExpense(null); }}
          onSubmit={handleSubmitExpense}
          members={[{ id: currentMemberId, name: 'Me', telephone: '' }]}
          initialExpense={editingExpense ?? undefined}
          isSettled={false}
          hidePayerAndSplit
        />
      )}

      {/* Confirm dialog (replaces window.confirm) */}
      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onOpenChange={open => { if (!open) setConfirm(null); }}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel ?? t('common.delete')}
          onConfirm={confirm.onConfirm}
          destructive={confirm.destructive ?? true}
        />
      )}

      {/* Duplicate expense dialog */}
      <Dialog open={expenseDuplicates.length > 0} onOpenChange={isOpen => { if (!isOpen) { setPendingExpenseData(null); setExpenseDuplicates([]); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('expenses.duplicateTitle')}</DialogTitle></DialogHeader>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>{t('expenses.duplicateDesc')}</p>
            {expenseDuplicates[0] && (
              <div className="mt-2 bg-muted rounded-lg p-3 text-foreground space-y-0.5">
                <p className="font-medium">{expenseDuplicates[0].description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(expenseDuplicates[0].amount, expenseDuplicates[0].currency)} · {expenseDuplicates[0].date}
                </p>
              </div>
            )}
            <p className="mt-2">{t('expenses.addAnywayQuestion')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingExpenseData(null); setExpenseDuplicates([]); }}>{t('expenses.cancel')}</Button>
            <Button className="bg-brand hover:bg-brand/90 text-white"
              onClick={async () => { if (pendingExpenseData) await doCreatePersonalExpense(pendingExpenseData); }}>
              {t('expenses.addAnyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      </div>
    </div>
  );
}
