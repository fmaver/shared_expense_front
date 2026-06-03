import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, ExternalLink, Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { useCategories } from '@/hooks/useCategories';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
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
} from '@/api/personal';
import { updateExpense, deleteExpense } from '@/api/expenses';
import { getCurrentUser } from '@/api/auth';
import type { ExpenseResponse, ExpenseCreate, IncomeInstanceResponse, RecurringPersonalExpenseInstanceResponse } from '@/types/expense';

export function PersonalDashboard() {
  const { t } = useTranslation();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const { data: ledger, isLoading, refetch } = usePersonalLedger(year, month);
  const { data: categories } = useCategories();

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
  const [savingIncome, setSavingIncome] = useState(false);

  // Income edit state
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [editIncomeLabel, setEditIncomeLabel] = useState('');
  const [editIncomeAmount, setEditIncomeAmount] = useState('');
  const [savingEditIncome, setSavingEditIncome] = useState(false);

  // Personal expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today.toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState('');
  const [savingExp, setSavingExp] = useState(false);

  // Expense edit state
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [showExpenseEdit, setShowExpenseEdit] = useState(false);

  // Recurring expense add form
  const [showRecurringExpForm, setShowRecurringExpForm] = useState(false);
  const [recExpLabel, setRecExpLabel] = useState('');
  const [recExpAmount, setRecExpAmount] = useState('');
  const [recExpCategory, setRecExpCategory] = useState('');
  const [savingRecExp, setSavingRecExp] = useState(false);

  // Recurring expense edit state
  const [editingRecExpId, setEditingRecExpId] = useState<number | null>(null);
  const [editRecExpLabel, setEditRecExpLabel] = useState('');
  const [editRecExpAmount, setEditRecExpAmount] = useState('');
  const [editRecExpCategory, setEditRecExpCategory] = useState('');
  const [savingEditRecExp, setSavingEditRecExp] = useState(false);

  // Keep expCategory in sync when categories load
  useEffect(() => {
    if (categories.length > 0 && !expCategory) {
      setExpCategory(categories[0].name);
    }
  }, [categories, expCategory]);

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

  const handleSaveIncome = async () => {
    if (!incomeLabel || !incomeAmount || !incomeForm || incomeForm === 'pick') return;
    setSavingIncome(true);
    try {
      if (incomeForm === 'recurring') {
        await createRecurringIncome({ label: incomeLabel, amount: parseFloat(incomeAmount), startYear: year, startMonth: month });
      } else {
        await createVariableIncome({ year, month, label: incomeLabel, amount: parseFloat(incomeAmount) });
      }
      toast.success(t('toasts.expenseAdded'));
      setIncomeForm(null);
      setIncomeLabel('');
      setIncomeAmount('');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingIncome(false);
    }
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

  const handleDeleteIncome = async (income: IncomeInstanceResponse) => {
    if (!window.confirm('Delete this income entry?')) return;
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
  };

  const handleSaveRecurringExpense = async () => {
    if (!recExpLabel || !recExpAmount || !recExpCategory) return;
    setSavingRecExp(true);
    try {
      await createRecurringPersonalExpense({
        label: recExpLabel,
        amount: parseFloat(recExpAmount),
        categoryName: recExpCategory,
        startYear: year,
        startMonth: month,
      });
      toast.success(t('toasts.expenseAdded'));
      setShowRecurringExpForm(false);
      setRecExpLabel(''); setRecExpAmount(''); setRecExpCategory(categories[0]?.name ?? '');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingRecExp(false);
    }
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

  const handleDeleteRecurringExpense = async (instance: RecurringPersonalExpenseInstanceResponse) => {
    if (!window.confirm('Delete this recurring expense from this month onwards?')) return;
    try {
      await deleteRecurringPersonalExpense(instance.recurringExpenseId, year, month);
      toast.success(t('toasts.expenseDeleted'));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSaveExpense = async () => {
    if (!expDesc || !expAmount || !expDate || !expCategory || !personalGroupId || !currentMemberId) return;
    setSavingExp(true);
    try {
      const { createExpense } = await import('@/api/expenses');
      const result = await createExpense(personalGroupId, {
        description: expDesc,
        amount: parseFloat(expAmount),
        date: expDate,
        category: { name: expCategory },
        payerId: currentMemberId,
        paymentType: 'debit',
        installments: 1,
        splitStrategy: { type: 'equal' },
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t('toasts.expenseAdded'));
      setShowExpenseForm(false);
      setExpDesc('');
      setExpAmount('');
      setExpDate(today.toISOString().slice(0, 10));
      setExpCategory(categories[0]?.name ?? '');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingExp(false);
    }
  };

  const handleUpdateExpense = async (data: ExpenseCreate) => {
    if (!editingExpense || !personalGroupId) return;
    const id = editingExpense.parentExpenseId ?? editingExpense.id;
    const { error } = await updateExpense(personalGroupId, id, data);
    if (error) { toast.error(error); return; }
    toast.success(t('toasts.expenseUpdated'));
    setShowExpenseEdit(false);
    setEditingExpense(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('personal.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('personal.subtitle')}</p>
      </div>

      {/* Month picker */}
      <MonthPicker year={year} month={month} onNavigate={handleNavigate} />

      {/* Balance summary cards */}
      {ledger && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{t('personal.totalIncome')}</p>
            <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(ledger.totalIncome)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{t('personal.totalExpenses')}</p>
            <p className="text-lg font-bold text-red-500 mt-1">{formatCurrency(ledger.totalPersonalExpenses)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">{t('personal.projectedBalance')}</p>
            <p className={`text-lg font-bold mt-1 ${ledger.projectedBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(ledger.projectedBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Settlement positions (per-group net balances) */}
      {ledger && ledger.groupBalances.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">{t('personal.settlementPositions')}</h2>
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
            <span className="text-muted-foreground font-medium">{t('personal.pendingSettlements')}</span>
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
          {/* Realized balance */}
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('personal.realizedBalance')}</span>
            <span className={ledger.realizedBalance >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
              {formatCurrency(ledger.realizedBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Income section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-600" />{t('personal.income')}
          </h2>
          <Button variant="outline" size="sm" onClick={() => setIncomeForm(f => f ? null : 'pick')}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t('personal.add')}
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
            <input className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder={t('personal.salaryLabel')} value={incomeLabel} onChange={e => setIncomeLabel(e.target.value)} />
            <input className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              type="number" placeholder={t('personal.salaryAmount')} value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setIncomeForm('pick'); setIncomeLabel(''); setIncomeAmount(''); }}>
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="font-semibold text-green-600 tabular-nums w-24 text-right">{formatCurrency(income.amount)}</span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>
                {editingIncomeId === income.id && (
                  <div className="mt-1 mb-2 p-2 bg-muted/40 rounded-md space-y-1.5">
                    <input
                      className="w-full border border-border rounded px-2 py-1 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                      value={editIncomeLabel}
                      onChange={e => setEditIncomeLabel(e.target.value)} />
                    <input
                      type="number"
                      className="w-full border border-border rounded px-2 py-1 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand"
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-red-500" /> {t('personal.personalExpenses')}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowExpenseForm(v => !v)}>
              <Plus className="h-3.5 w-3.5 mr-1" />{t('expenses.add')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRecurringExpForm(v => !v)}>
              <Repeat className="h-3.5 w-3.5 mr-1" />{t('personal.addRecurringExpense')}
            </Button>
          </div>
        </div>

        {showExpenseForm && personalGroupId && currentMemberId && (
          <div className="mb-3 p-3 bg-muted/40 rounded-lg space-y-2 text-sm">
            <input placeholder={t('expenseForm.description')} value={expDesc} onChange={e => setExpDesc(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
            <input type="number" placeholder={t('expenseForm.amount')} value={expAmount} onChange={e => setExpAmount(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
            <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand [color-scheme:light] dark:[color-scheme:dark]" />
            <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand">
              {categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowExpenseForm(false)}>{t('common.cancel')}</Button>
              <Button size="sm" disabled={savingExp} onClick={handleSaveExpense}
                className="bg-brand hover:bg-brand/90 text-white">
                {savingExp ? t('common.loading') : t('expenseForm.addExpense')}
              </Button>
            </div>
          </div>
        )}

        {showRecurringExpForm && personalGroupId && (
          <div className="mb-3 p-3 bg-muted/40 rounded-lg space-y-2 text-sm">
            <p className="text-xs text-muted-foreground font-medium">{t('personal.recurringExpenseTitle')}</p>
            <input placeholder={t('expenseForm.description')} value={recExpLabel} onChange={e => setRecExpLabel(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
            <input type="number" placeholder={t('expenseForm.amount')} value={recExpAmount} onChange={e => setRecExpAmount(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
            <select value={recExpCategory} onChange={e => setRecExpCategory(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand">
              {categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowRecurringExpForm(false)}>{t('common.cancel')}</Button>
              <Button size="sm" disabled={savingRecExp} onClick={handleSaveRecurringExpense}
                className="bg-brand hover:bg-brand/90 text-white">
                {savingRecExp ? t('common.loading') : t('personal.saveSalary')}
              </Button>
            </div>
          </div>
        )}

        {ledger && ledger.personalExpenses.length === 0 && ledger.recurringPersonalExpenses.length === 0 && !showExpenseForm ? (
          <p className="text-sm text-muted-foreground">{t('expenses.noExpenses')}</p>
        ) : (
          <div className="-mx-4">
            {/* Recurring personal expenses for this month */}
            {ledger?.recurringPersonalExpenses.map(instance => {
              const catEmoji = categories.find(c => c.name === instance.categoryName)?.emoji;
              return (
              <div key={`rec-exp-${instance.id}`} className="border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3 px-4 py-3 group hover:bg-accent/40 transition-colors">
                  {/* Category icon — matches ExpenseRow */}
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                  {/* Amount then actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground tabular-nums w-24 text-right">{formatCurrency(instance.amount)}</span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>
                {/* Inline edit form */}
                {editingRecExpId === instance.id && (
                  <div className="px-4 pb-3">
                    <div className="p-2 bg-muted/40 rounded-md space-y-1.5">
                      <input className="w-full border border-border rounded px-2 py-1 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                        value={editRecExpLabel} onChange={e => setEditRecExpLabel(e.target.value)} />
                      <input type="number" className="w-full border border-border rounded px-2 py-1 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                        value={editRecExpAmount} onChange={e => setEditRecExpAmount(e.target.value)} />
                      <select className="w-full border border-border rounded px-2 py-1 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                        value={editRecExpCategory} onChange={e => setEditRecExpCategory(e.target.value)}>
                        {categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                      </select>
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
                onEdit={e => { setEditingExpense(e); setShowExpenseEdit(true); }}
                onDelete={async e => {
                  const id = e.parentExpenseId ?? e.id;
                  if (!window.confirm('Delete this expense?')) return;
                  if (!personalGroupId) return;
                  const { success, error } = await deleteExpense(personalGroupId, id);
                  if (!success) { toast.error(error ?? t('toasts.failedDelete')); return; }
                  toast.success(t('toasts.expenseDeleted'));
                  refetch();
                }}
              />
            ))}
          </div>
        )}
      </div>

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
            {ledger?.mirroredShares.map(share => (
              <div key={share.sourceExpenseId} className="border-b border-border/50 last:border-0">
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
                      <span className="text-xs text-muted-foreground">
                        {share.installmentNo}/{share.installments}
                      </span>
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
                <ExpenseRow
                  expense={{
                    id: share.sourceExpenseId,
                    description: share.description,
                    amount: share.shareAmount,
                    date: share.date,
                    category: share.category,
                    payerId: 0,
                    paymentType: 'debit',
                    installments: 1,
                    installmentNo: 1,
                    splitStrategy: { type: 'equal' },
                  }}
                  members={[{ id: 0, name: share.sourceGroupName, telephone: '' }]}
                  isSettled={share.status === 'realized'}
                  hideSplitBadge
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit expense dialog */}
      {showExpenseEdit && editingExpense && personalGroupId && currentMemberId && (
        <AddExpenseDialog
          open={showExpenseEdit}
          onOpenChange={open => { setShowExpenseEdit(open); if (!open) setEditingExpense(null); }}
          onSubmit={handleUpdateExpense}
          members={[{ id: currentMemberId, name: 'Me', telephone: '' }]}
          initialExpense={editingExpense}
          isSettled={false}
        />
      )}
    </div>
  );
}
