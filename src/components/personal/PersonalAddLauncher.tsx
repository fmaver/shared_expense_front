import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIsland } from '@/contexts/IslandContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePersonalContext } from '@/hooks/usePersonalContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { AddIncomeDialog } from './AddIncomeDialog';
import { AddRecurringExpenseDialog } from './AddRecurringExpenseDialog';
import { checkSimilarExpenses } from '@/api/expenses';
import type { ExpenseCreate, ExpenseResponse, PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';

interface PersonalAddLauncherProps {
  ledger: PersonalLedgerResponse | null;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  refetch: () => void;
}

/**
 * Owns the personal-group add dialogs (income, one-off expense, recurring
 * expense) and registers their openers with the FAB actions context, so the
 * floating + dial and the desktop header buttons share one implementation.
 * Mounted by PersonalDashboard and PersonalSectionPage.
 */
export function PersonalAddLauncher({ ledger, year, month, categories, refetch }: PersonalAddLauncherProps) {
  const { t } = useTranslation();
  const island = useIsland();
  const { registerPersonalActions } = useFabActions();
  const { formatAmount } = useCurrency();
  const { personalGroupId, currentMemberId } = usePersonalContext();

  const [incomeDialog, setIncomeDialog] = useState<{ open: boolean; preset?: 'recurring' | 'variable' }>({ open: false });
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [recurringExpenseOpen, setRecurringExpenseOpen] = useState(false);

  // One-off expense duplicate detection
  const [pendingExpenseData, setPendingExpenseData] = useState<ExpenseCreate | null>(null);
  const [expenseDuplicates, setExpenseDuplicates] = useState<ExpenseResponse[]>([]);

  const addIncome = useCallback((type?: 'recurring' | 'variable') => setIncomeDialog({ open: true, preset: type }), []);
  const addExpense = useCallback(() => setExpenseOpen(true), []);
  const addRecurringExpense = useCallback(() => setRecurringExpenseOpen(true), []);

  useEffect(() => {
    registerPersonalActions({ addIncome, addExpense, addRecurringExpense });
    return () => registerPersonalActions(null);
  }, [registerPersonalActions, addIncome, addExpense, addRecurringExpense]);

  const doCreatePersonalExpense = async (data: ExpenseCreate) => {
    if (!personalGroupId || !currentMemberId) return;
    const { createExpense } = await import('@/api/expenses');
    const result = await createExpense(personalGroupId, { ...data, payerId: currentMemberId, splitStrategy: { type: 'equal' } });
    if (result.error) { toast.error(result.error); return; }
    toast.success(t('toasts.expenseAdded'));
    setPendingExpenseData(null);
    setExpenseDuplicates([]);
    setExpenseOpen(false);
    refetch();
    island.success();
  };

  const handleSubmitExpense = async (data: ExpenseCreate) => {
    if (!personalGroupId || !currentMemberId) return;
    const [y, m] = data.date.split('-').map(Number);
    const { data: similar } = await checkSimilarExpenses(personalGroupId, y, m, data.amount, data.description, data.date);
    if (similar && similar.length > 0) {
      setPendingExpenseData(data);
      setExpenseDuplicates(similar);
      return;
    }
    await doCreatePersonalExpense(data);
  };

  const handleSaved = () => {
    refetch();
    island.success();
  };

  return (
    <>
      <AddIncomeDialog
        open={incomeDialog.open}
        onOpenChange={open => setIncomeDialog(d => ({ ...d, open }))}
        presetType={incomeDialog.preset}
        year={year}
        month={month}
        existingIncomes={ledger?.incomes ?? []}
        onSaved={handleSaved}
      />

      <AddRecurringExpenseDialog
        open={recurringExpenseOpen}
        onOpenChange={setRecurringExpenseOpen}
        year={year}
        month={month}
        categories={categories}
        existingRecurring={ledger?.recurringPersonalExpenses ?? []}
        onSaved={handleSaved}
      />

      {expenseOpen && personalGroupId && currentMemberId && (
        <AddExpenseDialog
          open={expenseOpen}
          onOpenChange={setExpenseOpen}
          onSubmit={handleSubmitExpense}
          members={[{ id: currentMemberId, name: 'Me', telephone: '' }]}
          isSettled={false}
          hidePayerAndSplit
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
    </>
  );
}
