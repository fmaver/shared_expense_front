import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react';
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
} from '@/api/personal';
import { updateExpense, deleteExpense } from '@/api/expenses';
import { getCurrentUser } from '@/api/auth';
import type { ExpenseResponse, ExpenseCreate, IncomeInstanceResponse } from '@/types/expense';

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

  // Keep expCategory in sync when categories load
  useEffect(() => {
    if (categories.length > 0 && !expCategory) {
      setExpCategory(categories[0].name);
    }
  }, [categories, expCategory]);

  const handleNavigate = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleSaveIncome = async () => {
    if (!incomeLabel || !incomeAmount || !incomeForm || incomeForm === 'pick') return;
    setSavingIncome(true);
    try {
      if (incomeForm === 'recurring') {
        await createRecurringIncome({ label: incomeLabel, amount: parseFloat(incomeAmount) });
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
        });
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
        await deleteRecurringIncome(income.recurringIncomeId);
      } else {
        await deleteVariableIncome(income.id);
      }
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

      {/* Realized balance + pending settlements */}
      {ledger && (ledger.totalSharesPending > 0 || ledger.totalSharesRealized > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('personal.realizedBalance')}</p>
            <p className={`text-base font-semibold mt-0.5 ${ledger.realizedBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(ledger.realizedBalance)}
            </p>
          </div>
          {ledger.pendingSettlementsTotal > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t('personal.pendingSettlements')}</p>
              <p className="text-base font-semibold text-amber-600 mt-0.5">{formatCurrency(ledger.pendingSettlementsTotal)}</p>
            </div>
          )}
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
              <div key={income.id}>
                <div className="flex items-center justify-between py-1.5 text-sm gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${income.source === 'recurring' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {income.source === 'recurring' ? t('personal.recurringBadge') : t('personal.variableBadge')}
                    </span>
                    <span className="text-foreground truncate">{income.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { setEditingIncomeId(income.id); setEditIncomeLabel(income.label); setEditIncomeAmount(String(income.amount)); }}
                      className="text-muted-foreground hover:text-brand transition-colors p-0.5">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-semibold text-green-600">{formatCurrency(income.amount)}</span>
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
          <Button variant="outline" size="sm" onClick={() => setShowExpenseForm(v => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t('expenses.add')}
          </Button>
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

        {ledger && ledger.personalExpenses.length === 0 && !showExpenseForm ? (
          <p className="text-sm text-muted-foreground">{t('expenses.noExpenses')}</p>
        ) : (
          <div className="-mx-4">
            {ledger?.personalExpenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                members={currentMemberId ? [{ id: currentMemberId, name: 'Me', telephone: '' }] : []}
                isSettled={false}
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
