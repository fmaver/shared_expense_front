import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { useCategories } from '@/hooks/useCategories';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import {
  createRecurringIncome,
  createVariableIncome,
  getPersonalGroup,
} from '@/api/personal';
import { getCurrentUser } from '@/api/auth';

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

  // Salary form state
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryLabel, setSalaryLabel] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // Variable income form
  const [showVariableForm, setShowVariableForm] = useState(false);
  const [varLabel, setVarLabel] = useState('');
  const [varAmount, setVarAmount] = useState('');
  const [savingVar, setSavingVar] = useState(false);

  // Personal expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today.toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState('');
  const [savingExp, setSavingExp] = useState(false);

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

  const handleSaveSalary = async () => {
    if (!salaryLabel || !salaryAmount) return;
    setSavingSalary(true);
    try {
      await createRecurringIncome({ label: salaryLabel, amount: parseFloat(salaryAmount) });
      toast.success(t('toasts.expenseAdded'));
      setShowSalaryForm(false);
      setSalaryLabel('');
      setSalaryAmount('');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingSalary(false);
    }
  };

  const handleSaveVariable = async () => {
    if (!varLabel || !varAmount) return;
    setSavingVar(true);
    try {
      await createVariableIncome({ year, month, label: varLabel, amount: parseFloat(varAmount) });
      toast.success(t('toasts.expenseAdded'));
      setShowVariableForm(false);
      setVarLabel('');
      setVarAmount('');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingVar(false);
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
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-semibold text-foreground">{t('personal.income')}</h2>
        </div>

        {/* Recurring income (salary) */}
        <div className="border border-border rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t('personal.recurringTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('personal.recurringDesc')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSalaryForm(v => !v)}>
              <Plus className="h-3.5 w-3.5 mr-1" />{t('personal.add')}
            </Button>
          </div>
          {showSalaryForm && (
            <div className="mt-3 space-y-2 text-sm">
              <input className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder={t('personal.salaryLabel')} value={salaryLabel} onChange={e => setSalaryLabel(e.target.value)} />
              <input className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                type="number" placeholder={t('personal.salaryAmount')} value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowSalaryForm(false)}>{t('common.cancel')}</Button>
                <Button size="sm" disabled={savingSalary} onClick={handleSaveSalary}
                  className="bg-brand hover:bg-brand/90 text-white">
                  {savingSalary ? t('common.loading') : t('personal.saveSalary')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Variable income (one-off) */}
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t('personal.variableTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('personal.variableDesc')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowVariableForm(v => !v)}>
              <Plus className="h-3.5 w-3.5 mr-1" />{t('personal.add')}
            </Button>
          </div>
          {showVariableForm && (
            <div className="mt-3 space-y-2 text-sm">
              <input className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder={t('personal.salaryLabel')} value={varLabel} onChange={e => setVarLabel(e.target.value)} />
              <input className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                type="number" placeholder={t('personal.salaryAmount')} value={varAmount} onChange={e => setVarAmount(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowVariableForm(false)}>{t('common.cancel')}</Button>
                <Button size="sm" disabled={savingVar} onClick={handleSaveVariable}
                  className="bg-brand hover:bg-brand/90 text-white">
                  {savingVar ? t('common.loading') : t('personal.saveSalary')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Income list */}
        {ledger && ledger.incomes.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">{t('personal.noIncome')}</p>
        ) : (
          <div className="space-y-1.5 mt-3">
            {ledger?.incomes.map(income => (
              <div key={income.id} className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${income.source === 'recurring' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {income.source === 'recurring' ? t('personal.salary') : t('personal.variableTitle')}
                  </span>
                  <span className="text-foreground">{income.label}</span>
                </div>
                <span className="font-semibold text-green-600">{formatCurrency(income.amount)}</span>
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
              className="w-full border border-border rounded-md px-3 py-1.5 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
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
          <div className="space-y-1.5">
            {ledger?.personalExpenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between py-1.5 text-sm">
                <div>
                  <p className="text-foreground">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">{exp.category} · {exp.date}</p>
                </div>
                <span className="font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mirrored shares from shared groups */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
          <TrendingDown className="h-4 w-4 text-red-500" /> {t('personal.mirroredShares')}
        </h2>
        {ledger && ledger.mirroredShares.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('personal.noShares')}</p>
        ) : (
          <div className="space-y-2">
            {ledger?.mirroredShares.map(share => (
              <div key={`${share.sourceExpenseId}`}
                className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {share.status === 'pending' ? (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                        <Clock className="h-3 w-3" />{t('personal.pending')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" />{t('personal.realized')}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{t('personal.fromGroup', { groupName: share.sourceGroupName })}</span>
                  </div>
                  <p className="text-sm text-foreground truncate mt-0.5">{share.description}</p>
                  <p className="text-xs text-muted-foreground">{share.category} · {share.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-sm text-red-500">-{formatCurrency(share.shareAmount)}</span>
                  <Link to={`/groups/${share.sourceGroupId}`}
                    className="text-muted-foreground hover:text-brand transition-colors"
                    title={t('personal.viewInGroup')}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
