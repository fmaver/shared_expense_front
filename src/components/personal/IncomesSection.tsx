import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { capitalize } from '@/utils/format';
import { ViewAllLink } from './ViewAllLink';
import { ShowMoreButton } from './ShowMoreButton';
import { IncomeDetailDialog } from './IncomeDetailDialog';
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal';
import {
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
  const { personalActions } = useFabActions();

  // Income edit state (desktop inline editor)
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [editIncomeLabel, setEditIncomeLabel] = useState('');
  const [editIncomeAmount, setEditIncomeAmount] = useState('');
  const [editIncomeCurrency, setEditIncomeCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [savingEditIncome, setSavingEditIncome] = useState(false);

  // Tap-to-open detail sheet (the mobile edit/delete entry point)
  const [detailIncome, setDetailIncome] = useState<IncomeInstanceResponse | null>(null);

  // Confirmation dialog state — replaces window.confirm()
  const [confirm, setConfirm] = useState<{ title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void } | null>(null);

  // Incomes carry no date — instance ids increase with creation order, so id desc = latest first
  const sortedIncomes = [...ledger.incomes].sort((a, b) => b.id - a.id);
  const { visibleCount, hasMore, remaining, showMore } = useProgressiveReveal(limit, sortedIncomes.length);
  const visibleIncomes = sortedIncomes.slice(0, visibleCount);

  // Shared save used by both the desktop inline editor and the detail sheet.
  const saveIncome = async (income: IncomeInstanceResponse, label: string, amount: number, currency: 'ARS' | 'USD'): Promise<boolean> => {
    if (!label || !Number.isFinite(amount)) return false;
    try {
      if (income.source === 'recurring' && income.recurringIncomeId) {
        await updateRecurringIncome(income.recurringIncomeId, { label, amount, currency }, year, month);
      } else {
        await updateVariableIncome(income.id, { label, amount, currency });
      }
      toast.success(t('toasts.expenseUpdated'));
      refetch();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
      return false;
    }
  };

  const handleSaveInlineEdit = async (income: IncomeInstanceResponse) => {
    setSavingEditIncome(true);
    const ok = await saveIncome(income, editIncomeLabel, parseFloat(editIncomeAmount), editIncomeCurrency);
    setSavingEditIncome(false);
    if (ok) setEditingIncomeId(null);
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 min-w-0">
            <TrendingUp className="h-4 w-4 text-green-600 shrink-0" /><span className="truncate">{t('personal.income')}</span>
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
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {hasMore && viewAllTo && <ViewAllLink to={viewAllTo} count={ledger.incomes.length} />}
          {/* Mobile adds via the floating + dial; desktop keeps this button */}
          <Button variant="outline" size="sm" className="hidden lg:inline-flex"
            onClick={() => personalActions?.addIncome()}>
            <Plus className="h-3.5 w-3.5 mr-1" /><span>{t('personal.add')}</span>
          </Button>
        </div>
      </div>

      {/* Income list */}
      {ledger.incomes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('personal.noIncome')}</p>
      ) : (
        <div className="space-y-1.5">
          {visibleIncomes.map(income => (
            <div key={income.id} className="group">
              <div
                className="flex items-center justify-between py-1.5 text-sm gap-2 cursor-pointer rounded-md -mx-1 px-1 [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors touch-manipulation"
                onClick={() => setDetailIncome(income)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${income.source === 'recurring' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {income.source === 'recurring' ? t('personal.recurringBadge') : t('personal.variableBadge')}
                  </span>
                  <span className="text-foreground truncate">{capitalize(income.label)}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {income.currency === 'USD' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">USD</span>
                  )}
                  <span className="font-semibold text-green-600 tabular-nums w-24 text-right">{formatAmount(income.amount, income.currency)}</span>
                </div>
                <div
                  className="[@media(hover:none)]:hidden flex items-center gap-1 opacity-0 invisible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:visible transition-opacity flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setEditingIncomeId(income.id); setEditIncomeLabel(income.label); setEditIncomeAmount(String(income.amount)); setEditIncomeCurrency(income.currency === 'USD' ? 'USD' : 'ARS'); }}>
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editIncomeAmount}
                      onChange={e => setEditIncomeAmount(e.target.value)} />
                    <CurrencyToggle value={editIncomeCurrency} onChange={setEditIncomeCurrency} />
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setEditingIncomeId(null)}>{t('common.cancel')}</Button>
                    <Button size="sm" className="h-6 text-xs px-2 bg-brand hover:bg-brand/90 text-white"
                      disabled={savingEditIncome} onClick={() => handleSaveInlineEdit(income)}>
                      {savingEditIncome ? '…' : t('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {hasMore && <ShowMoreButton remaining={remaining} onClick={showMore} />}
        </div>
      )}

      {/* Tap-to-open detail sheet — the mobile edit/delete entry point */}
      <IncomeDetailDialog
        income={detailIncome}
        open={detailIncome !== null}
        onOpenChange={open => { if (!open) setDetailIncome(null); }}
        formatAmount={formatAmount}
        onSave={async (income, label, amount, currency) => {
          const ok = await saveIncome(income, label, amount, currency);
          if (ok) setDetailIncome(null);
          return ok;
        }}
        onDelete={income => { setDetailIncome(null); handleDeleteIncome(income); }}
      />

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
