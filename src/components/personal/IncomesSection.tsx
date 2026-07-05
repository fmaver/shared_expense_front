import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ViewAllLink } from './ViewAllLink';
import {
  createRecurringIncome,
  createVariableIncome,
  updateRecurringIncome,
  updateVariableIncome,
  deleteRecurringIncome,
  deleteVariableIncome,
} from '@/api/personal';
import type { IncomeInstanceResponse, PersonalLedgerResponse } from '@/types/expense';

interface IncomesSectionProps {
  ledger: PersonalLedgerResponse;
  year: number;
  month: number;
  refetch: () => void;
  /** Show only the latest N rows (dashboard); omit for the full page. */
  limit?: number;
  /** Target of the "View all" link; shown when there are more rows than `limit`. */
  viewAllTo?: string;
}

export function IncomesSection({ ledger, year, month, refetch, limit, viewAllTo }: IncomesSectionProps) {
  const { t } = useTranslation();
  const { displayMode, setDisplayMode, blueRate, formatAmount } = useCurrency();

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

  // Confirmation dialog state — replaces window.confirm()
  const [confirm, setConfirm] = useState<{ title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void } | null>(null);

  // Incomes carry no date — instance ids increase with creation order, so id desc = latest first
  const sortedIncomes = [...ledger.incomes].sort((a, b) => b.id - a.id);
  const visibleIncomes = limit ? sortedIncomes.slice(0, limit) : sortedIncomes;
  const hasMore = limit !== undefined && ledger.incomes.length > limit;

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
    const isDuplicate = ledger.incomes.some(
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

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-600" />{t('personal.income')}
          </h2>
          {blueRate !== null && ledger.incomes.some(i => i.currency === 'USD') && (
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
        <div className="flex items-center gap-2.5 ml-auto">
          {hasMore && viewAllTo && <ViewAllLink to={viewAllTo} count={ledger.incomes.length} />}
          <Button variant="outline" size="sm" onClick={() => setIncomeForm(f => f ? null : 'pick')}>
            <Plus className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">{t('personal.add')}</span>
          </Button>
        </div>
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
              ← {t('common.back')}
            </Button>
            <Button size="sm" disabled={savingIncome} onClick={handleSaveIncome}
              className="bg-brand hover:bg-brand/90 text-white">
              {savingIncome ? t('common.loading') : t('personal.saveSalary')}
            </Button>
          </div>
        </div>
      )}

      {/* Income list */}
      {ledger.incomes.length === 0 && !incomeForm ? (
        <p className="text-sm text-muted-foreground">{t('personal.noIncome')}</p>
      ) : (
        <div className="space-y-1.5">
          {visibleIncomes.map(income => (
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
    </div>
  );
}
