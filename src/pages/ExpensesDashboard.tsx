import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import {
  checkSimilarExpenses, createExpense, updateExpense, deleteExpense,
} from '@/api/expenses';
import {
  settleMonthlyShare, unsettleMonthlyShare, downloadMonthlyPdf,
} from '@/api/shares';
import { MonthPicker } from '@/components/expenses/MonthPicker';
import { BalancePanel } from '@/components/expenses/BalancePanel';
import { ExpenseListHeader } from '@/components/expenses/ExpenseListHeader';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { TransferDialog } from '@/components/expenses/TransferDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, ArrowLeftRight } from 'lucide-react';
import type { ExpenseCreate, ExpenseResponse } from '@/types/expense';

export function ExpensesDashboard() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [pendingExpense, setPendingExpense] = useState<ExpenseCreate | null>(null);
  const [duplicates, setDuplicates] = useState<ExpenseResponse[]>([]);
  const [sortedExpenses, setSortedExpenses] = useState<ExpenseResponse[]>([]);
  const [isSettling, setIsSettling] = useState(false);
  const [isUnsettling, setIsUnsettling] = useState(false);

  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(groupId);
  const {
    data: monthlyData, isLoading: loadingExpenses, refetch,
  } = useMonthlyBalance(groupId, year, month);

  const expenses = monthlyData?.expenses ?? [];
  const isSettled = monthlyData?.isSettled ?? false;

  const submitExpense = async (data: ExpenseCreate) => {
    const { data: result, error } = await createExpense(groupId, data);
    if (error || !result) throw new Error(error ?? 'Failed to create expense');
    setShowAdd(false);
    setShowTransfer(false);
    setPendingExpense(null);
    setDuplicates([]);
    refetch();
    toast.success('Expense added');
  };

  const handleCreate = async (data: ExpenseCreate) => {
    const [y, m] = data.date.split('-').map(Number);
    const { data: similar } = await checkSimilarExpenses(groupId, y, m, data.amount, data.description, data.date);
    if (similar && similar.length > 0) { setPendingExpense(data); setDuplicates(similar); return; }
    await submitExpense(data);
  };

  const handleUpdate = async (data: ExpenseCreate) => {
    if (!editingExpense) return;
    const { data: result, error } = await updateExpense(groupId, editingExpense.id, data);
    if (error || !result) { toast.error(error ?? 'Failed to update'); return; }
    setEditingExpense(null);
    setShowAdd(false);
    refetch();
    toast.success('Expense updated');
  };

  const handleDelete = async (expense: ExpenseResponse) => {
    const id = expense.parentExpenseId ?? expense.id;
    const msg = expense.installments > 1
      ? 'This will delete all installments. Continue?'
      : 'Delete this expense?';
    if (!window.confirm(msg)) return;
    const { success, error } = await deleteExpense(groupId, id);
    if (!success) { toast.error(error ?? 'Failed to delete'); return; }
    refetch();
    toast.success('Expense deleted');
  };

  const handleSettle = async () => {
    setIsSettling(true);
    try {
      const result = await settleMonthlyShare(groupId, year, month);
      if (!result) throw new Error('Failed to settle');
      refetch();
      toast.success('Month settled');
    } catch {
      toast.error('Failed to settle');
    } finally {
      setIsSettling(false);
    }
  };

  const handleUnsettle = async () => {
    setIsUnsettling(true);
    try {
      const result = await unsettleMonthlyShare(groupId, year, month);
      if (!result) throw new Error('Failed to reopen');
      refetch();
      toast.success('Month reopened');
    } catch {
      toast.error('Failed to reopen');
    } finally {
      setIsUnsettling(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await downloadMonthlyPdf(groupId, year, month);
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const handleSorted = useCallback((s: ExpenseResponse[]) => setSortedExpenses(s), []);

  if (loadingMembers) {
    return <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      <MonthPicker year={year} month={month} onNavigate={(y, m) => { setYear(y); setMonth(m); }} />

      {monthlyData && (
        <BalancePanel
          balances={monthlyData.balances}
          members={members}
          isSettled={isSettled}
          onSettle={handleSettle} isSettling={isSettling}
          onUnsettle={handleUnsettle} isUnsettling={isUnsettling}
          expenses={expenses}
        />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Expenses</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
              onClick={handleExportPDF}>
              Export PDF
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs"
              onClick={() => { setShowTransfer(true); setShowAdd(false); }}>
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> Transfer
            </Button>
            <Button size="sm" className="h-7 px-2.5 text-xs bg-brand hover:bg-brand/90 text-white"
              onClick={() => { setShowAdd(true); setShowTransfer(false); setEditingExpense(null); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
            </Button>
          </div>
        </div>

        {loadingExpenses ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No expenses this month.</div>
        ) : (
          <>
            <ExpenseListHeader expenses={expenses} members={members} onSorted={handleSorted} />
            <div className="divide-y divide-border">
              {sortedExpenses.map(e => (
                <ExpenseRow key={e.id} expense={e} members={members} isSettled={isSettled}
                  onEdit={exp => { setEditingExpense(exp); setShowAdd(true); }}
                  onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </div>

      <AddExpenseDialog
        open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) setEditingExpense(null); }}
        onSubmit={editingExpense ? handleUpdate : handleCreate}
        members={members}
        initialExpense={editingExpense ?? undefined}
        isSettled={isSettled}
      />

      <TransferDialog
        open={showTransfer} onOpenChange={setShowTransfer}
        onSubmit={handleCreate} members={members}
      />

      <Dialog open={duplicates.length > 0} onOpenChange={(isOpen) => { if (!isOpen) { setPendingExpense(null); setDuplicates([]); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Similar expense found</DialogTitle></DialogHeader>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>A similar expense already exists this month:</p>
            {duplicates[0] && (
              <div className="mt-2 bg-muted rounded-lg p-3 text-foreground space-y-0.5">
                <p className="font-medium">{duplicates[0].description}</p>
                <p className="text-xs text-muted-foreground">
                  ${duplicates[0].amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} · {duplicates[0].date}
                </p>
              </div>
            )}
            <p className="mt-2">Add anyway?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingExpense(null); setDuplicates([]); }}>Cancel</Button>
            <Button className="bg-brand hover:bg-brand/90 text-white"
              onClick={async () => { if (pendingExpense) await submitExpense(pendingExpense); }}>
              Yes, add it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
