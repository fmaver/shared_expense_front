import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import {
  checkSimilarExpenses, createExpense, updateExpense, deleteExpense,
} from '@/api/expenses';
import {
  updateRecurringGroupExpense, deleteRecurringGroupExpense,
} from '@/api/recurringExpenses';
import {
  settleMonthlyShare, unsettleMonthlyShare, downloadMonthlyPdf,
} from '@/api/shares';
import { getCurrentUser } from '@/api/auth';
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
import { Plus, ArrowLeftRight, FileDown } from 'lucide-react';
import type { ExpenseCreate, ExpenseResponse } from '@/types/expense';
import { useIsland } from '@/contexts/IslandContext';

export function ExpensesDashboard() {
  const { t } = useTranslation();
  const island = useIsland();
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then(u => setCurrentMemberId(u.id)).catch(() => {});
  }, []);

  const [searchParams] = useSearchParams();
  const [year, setYear] = useState(() => {
    const y = searchParams.get('year');
    return y ? parseInt(y, 10) : new Date().getFullYear();
  });
  const [month, setMonth] = useState(() => {
    const m = searchParams.get('month');
    return m ? parseInt(m, 10) : new Date().getMonth() + 1;
  });
  const highlightId = searchParams.get('highlight') ? parseInt(searchParams.get('highlight')!, 10) : null;
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [pendingExpense, setPendingExpense] = useState<ExpenseCreate | null>(null);
  const [duplicates, setDuplicates] = useState<ExpenseResponse[]>([]);
  const [sortedExpenses, setSortedExpenses] = useState<ExpenseResponse[]>([]);
  const [isSettling, setIsSettling] = useState(false);
  const [isUnsettling, setIsUnsettling] = useState(false);
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseResponse | null>(null);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<number | null>(null); // templateId
  const [recurringEditTarget, setRecurringEditTarget] = useState<ExpenseResponse | null>(null);

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
    toast.success(t('toasts.expenseAdded'));
    island.success();
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
    if (error || !result) { toast.error(error ?? t('toasts.failedDelete')); return; }
    setEditingExpense(null);
    setShowAdd(false);
    refetch();
    toast.success(t('toasts.expenseUpdated'));
    island.success();
  };

  const handleDelete = (expense: ExpenseResponse) => {
    setDeleteTarget(expense);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.parentExpenseId ?? deleteTarget.id;
    setDeleteTarget(null);
    const { success, error } = await deleteExpense(groupId, id);
    if (!success) { toast.error(error ?? t('toasts.failedDelete')); return; }
    refetch();
    toast.success(t('toasts.expenseDeleted'));
  };

  const confirmRecurringDelete = async () => {
    if (recurringDeleteTarget == null) return;
    const templateId = recurringDeleteTarget;
    setRecurringDeleteTarget(null);
    const { success, error } = await deleteRecurringGroupExpense(groupId, templateId, year, month);
    if (!success) { toast.error(error ?? t('toasts.failedDelete')); return; }
    refetch();
    toast.success(t('toasts.recurringExpenseDeleted'));
  };

  const handleRecurringUpdate = async (data: ExpenseCreate) => {
    if (!recurringEditTarget?.recurringTemplateId) return;
    const { error } = await updateRecurringGroupExpense(
      groupId,
      recurringEditTarget.recurringTemplateId,
      {
        description: data.description,
        amount: data.amount,
        category: data.category.name,
        payerId: data.payerId,
        paymentType: data.paymentType,
        splitStrategy: data.splitStrategy,
      },
      year,
      month,
    );
    if (error) { toast.error(error); return; }
    setRecurringEditTarget(null);
    setShowAdd(false);
    refetch();
    toast.success(t('toasts.expenseUpdated'));
    island.success();
  };

  const handleSettle = async () => {
    setIsSettling(true);
    island.loading();
    try {
      const result = await settleMonthlyShare(groupId, year, month);
      if (!result) throw new Error('Failed to settle');
      refetch();
      toast.success(t('toasts.monthSettled'));
      island.success();
    } catch {
      toast.error(t('toasts.failedSettle'));
      island.reset();
    } finally {
      setIsSettling(false);
    }
  };

  const handleUnsettle = async () => {
    setIsUnsettling(true);
    island.loading();
    try {
      const result = await unsettleMonthlyShare(groupId, year, month);
      if (!result) throw new Error('Failed to reopen');
      refetch();
      toast.success(t('toasts.monthReopened'));
      island.success();
    } catch {
      toast.error(t('toasts.failedReopen'));
      island.reset();
    } finally {
      setIsUnsettling(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await downloadMonthlyPdf(groupId, year, month);
    } catch {
      toast.error(t('toasts.failedExport'));
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
          transfers={monthlyData.transfers ?? []}
          members={members}
          isSettled={isSettled}
          onSettleRequest={() => setShowSettleConfirm(true)}
          isSettling={isSettling}
          onUnsettle={handleUnsettle} isUnsettling={isUnsettling}
          expenses={expenses}
        />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{t('expenses.title')}</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground shrink-0"
              onClick={handleExportPDF}
              title={t('expenses.exportPdfTitle')}>
              <FileDown className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">{t('expenses.exportPdf')}</span>
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs shrink-0"
              title={t('expenses.transfer')}
              onClick={() => { setShowTransfer(true); setShowAdd(false); }}>
              <ArrowLeftRight className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('expenses.transfer')}</span>
            </Button>
            <Button size="sm" className="h-7 px-2 text-xs bg-brand hover:bg-brand/90 text-white shrink-0"
              title={t('expenses.add')}
              onClick={() => { setShowAdd(true); setShowTransfer(false); setEditingExpense(null); }}>
              <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('expenses.add')}</span>
            </Button>
          </div>
        </div>

        {loadingExpenses ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">{t('expenses.noExpenses')}</div>
        ) : (
          <>
            <ExpenseListHeader expenses={expenses} members={members} onSorted={handleSorted} />
            <div className="divide-y divide-border">
              {sortedExpenses.map(e => (
                <ExpenseRow key={e.id} expense={e} members={members} isSettled={isSettled}
                  highlight={e.id === highlightId}
                  groupId={groupId}
                  viewedYear={year}
                  viewedMonth={month}
                  onEdit={exp => { setEditingExpense(exp); setShowAdd(true); }}
                  onDelete={handleDelete}
                  onRecurringDelete={templateId => setRecurringDeleteTarget(templateId)}
                  onRecurringEdit={exp => { setRecurringEditTarget(exp); setShowAdd(true); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AddExpenseDialog
        open={showAdd}
        onOpenChange={v => {
          setShowAdd(v);
          if (!v) { setEditingExpense(null); setRecurringEditTarget(null); }
        }}
        onSubmit={recurringEditTarget ? handleRecurringUpdate : (editingExpense ? handleUpdate : handleCreate)}
        members={members}
        initialExpense={recurringEditTarget ?? editingExpense ?? undefined}
        isSettled={isSettled}
        currentMemberId={currentMemberId}
        groupId={groupId}
        onSuccess={refetch}
        isRecurringEdit={!!recurringEditTarget}
      />

      <TransferDialog
        open={showTransfer} onOpenChange={setShowTransfer}
        onSubmit={handleCreate} members={members}
        currentMemberId={currentMemberId}
      />

      <Dialog open={duplicates.length > 0} onOpenChange={(isOpen) => { if (!isOpen) { setPendingExpense(null); setDuplicates([]); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('expenses.duplicateTitle')}</DialogTitle></DialogHeader>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>{t('expenses.duplicateDesc')}</p>
            {duplicates[0] && (
              <div className="mt-2 bg-muted rounded-lg p-3 text-foreground space-y-0.5">
                <p className="font-medium">{duplicates[0].description}</p>
                <p className="text-xs text-muted-foreground">
                  ${duplicates[0].amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} · {duplicates[0].date}
                </p>
              </div>
            )}
            <p className="mt-2">{t('expenses.addAnywayQuestion')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingExpense(null); setDuplicates([]); }}>{t('expenses.cancel')}</Button>
            <Button className="bg-brand hover:bg-brand/90 text-white"
              onClick={async () => { if (pendingExpense) await submitExpense(pendingExpense); }}>
              {t('expenses.addAnyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('expenses.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget && deleteTarget.installments > 1
              ? t('expenses.deleteInstallments')
              : t('expenses.deleteSingle')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('expenses.deleteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring delete confirmation dialog */}
      <Dialog open={recurringDeleteTarget !== null} onOpenChange={(isOpen) => { if (!isOpen) setRecurringDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('expenses.deleteRecurringTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('expenses.deleteRecurringDesc')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecurringDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmRecurringDelete}>
              {t('expenses.deleteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle confirmation dialog */}
      <Dialog open={showSettleConfirm} onOpenChange={(isOpen) => { if (!isOpen) setShowSettleConfirm(false); }}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {t('balance.settleConfirmTitle', { month: (t('months', { returnObjects: true }) as string[])[month - 1], year })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('balance.settleConfirmDesc')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettleConfirm(false)}>{t('common.cancel')}</Button>
            <Button
              className="cursor-pointer"
              style={{ backgroundColor: '#4CAF50', color: 'white' }}
              onClick={async () => { setShowSettleConfirm(false); await handleSettle(); }}
            >
              {t('balance.settleUp')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
