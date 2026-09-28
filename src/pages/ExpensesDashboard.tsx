import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import { useGroup } from '@/hooks/useGroups';
import {
  checkSimilarExpenses, createExpense, updateExpense, deleteExpense,
} from '@/api/expenses';
import {
  updateRecurringGroupExpense, deleteRecurringGroupExpense,
} from '@/api/recurringExpenses';
import { getCurrentUser } from '@/api/auth';
import { MonthPager } from '@/components/expenses/MonthPager';
import { SettleSheet } from '@/components/expenses/SettleSheet';
import { GroupBalanceCard } from '@/components/expenses/GroupBalanceCard';
import { SettledMonthCard } from '@/components/expenses/SettledMonthCard';
import { ExpenseListHeader } from '@/components/expenses/ExpenseListHeader';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { useScanPicker } from '@/components/expenses/ScanPicker';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, ArrowLeftRight, Camera, Search } from 'lucide-react';
import type { ExpenseCreate, ExpenseResponse } from '@/types/expense';
import { useIsland } from '@/contexts/IslandContext';
import { useSearch } from '@/contexts/SearchContext';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { useSettlementState } from '@/contexts/SettlementContext';
import { useSettlementActions } from '@/hooks/useSettlementActions';
import { formatDayHeading } from '@/utils/format';
import { settleScope } from '@/utils/settleLog';
import { cn } from '@/lib/utils';

export function ExpensesDashboard() {
  const { t } = useTranslation();
  const island = useIsland();
  const { openSearch } = useSearch();
  const navigate = useNavigate();
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then(u => setCurrentMemberId(u.id)).catch(() => {});
  }, []);

  const [searchParams] = useSearchParams();
  // El mes vive en la URL: así lo comparten Gastos y Números, y una notificación que linkea a
  // un mes lo cambia sin necesidad de remontar la página.
  const { year, month, setYearMonth } = useMonthSearchParams();

  const highlightId = searchParams.get('highlight') ? parseInt(searchParams.get('highlight')!, 10) : null;
  const [showAdd, setShowAdd] = useState(false);
  /* Desktop: la foto de un ticket abre la misma hoja, leyéndola (V6.6). */
  const [scanFile, setScanFile] = useState<File | null>(null);
  const scanPicker = useScanPicker(file => {
    setScanFile(file);
    setEditingExpense(null);
    setShowTransfer(false);
    setShowAdd(true);
  });
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [pendingExpense, setPendingExpense] = useState<ExpenseCreate | null>(null);
  const [duplicates, setDuplicates] = useState<ExpenseResponse[]>([]);
  const [sortedExpenses, setSortedExpenses] = useState<ExpenseResponse[]>([]);
  const [groupByDate, setGroupByDate] = useState(true);
  const [showSettle, setShowSettle] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseResponse | null>(null);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<number | null>(null); // templateId
  const [recurringEditTarget, setRecurringEditTarget] = useState<ExpenseResponse | null>(null);

  // A push notification links to one expense: /groups/7?year=2026&month=5&expense=42.
  // The month is already read from the same params, so the row is on screen by the time this
  // matches — it only has to say which one to open.
  const deepLinkedExpenseId = Number(searchParams.get('expense')) || null;

  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  // Three states, not two: until the group loads its type is *unknown*, and treating that as
  // "ongoing" is what made a puntual group request /shares/{year}/{month} and settle a single
  // month. Nothing month-shaped may run before this is known.
  const groupTypeKnown = !loadingGroup && group !== undefined;
  const isOneTime = group?.groupType === 'one_time';

  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(groupId);
  const {
    data: monthlyData, isLoading: loadingExpenses, refetch,
  } = useMonthlyBalance(groupId, year, month, isOneTime, groupTypeKnown);

  const expenses = monthlyData?.expenses ?? [];
  const isSettled = monthlyData?.isSettled ?? false;

  const yourPosition = currentMemberId != null && monthlyData
    ? (monthlyData.balances[String(currentMemberId)] ?? 0)
    : null;

  // El "+" de la barra flotante vive en otro árbol y tiene que apagarse cuando el mes está
  // cerrado: se le publica lo que esta página ya sabe.
  const { setViewedMonthState } = useSettlementState();
  useEffect(() => {
    setViewedMonthState({ isSettled, yourBalance: yourPosition });
    return () => setViewedMonthState({ isSettled: false, yourBalance: null });
  }, [isSettled, yourPosition, setViewedMonthState]);

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




  // Cerrar, reabrir y exportar: una sola implementación, compartida con la pantalla de Gente.
  const { unsettle: handleUnsettle, exportPdf: handleExportPDF } =
    useSettlementActions({
      groupId,
      groupName: group?.name ?? '',
      year,
      month,
      isOneTime,
      groupTypeKnown,
      refetch,
    });

  const monthName = (t('months', { returnObjects: true }) as string[])[month - 1];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const weekdaysLong = t('weekdaysLong', { returnObjects: true }) as string[];
  /* Los pagos ya marcados son los movimientos `prestamo`: no hay flag y no hace falta. */
  const paidMoves = expenses.filter(e => e.category === 'prestamo');
  const scope = settleScope(groupId, isOneTime, year, month);
  const settleProgressPath = `/groups/${groupId}/settle?year=${year}&month=${month}`;

  /*
    Saldar entra por el plan, salvo que ya lo hayas arrancado: con un pago marcado el plan es
    pasado y lo que se quiere ver es cómo va la cosa.
  */
  const openSettle = () => {
    if (paidMoves.length > 0) navigate(settleProgressPath);
    else setShowSettle(true);
  };

  const handleSorted = useCallback((s: ExpenseResponse[], byDate: boolean) => {
    setSortedExpenses(s);
    setGroupByDate(byDate);
  }, []);

  /*
    Los gastos partidos por día. Con cualquier orden que no sea por fecha se devuelve un solo
    bloque sin encabezado: agrupar ahí daría títulos salteados y repetidos.
  */
  const days = (() => {
    if (!groupByDate) return [{ key: 'all', heading: null, expenses: sortedExpenses }];
    const buckets: { key: string; heading: string; expenses: ExpenseResponse[] }[] = [];
    for (const expense of sortedExpenses) {
      const last = buckets[buckets.length - 1];
      if (last && last.key === expense.date) { last.expenses.push(expense); continue; }
      buckets.push({
        key: expense.date,
        heading: formatDayHeading(expense.date, monthsShort, weekdaysLong),
        expenses: [expense],
      });
    }
    return buckets;
  })();

  if (loadingMembers) {
    return <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>;
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl space-y-4 px-5 py-4 lg:px-7 lg:py-6">
      {/*
        Lo primero: cómo venís vos. La lista sola no contesta "¿tengo a favor o debo?".
        Con el mes cerrado la pregunta ya no existe, y el lugar lo ocupa el cierre.
      */}
      {monthlyData && (
        isSettled ? (
          <SettledMonthCard
            isOneTime={isOneTime}
            groupName={group?.name ?? ''}
            month={month}
            expenses={expenses}
            onExportPdf={handleExportPDF}
            onReopen={handleUnsettle}
          />
        ) : (
          <GroupBalanceCard
            isOneTime={isOneTime}
            monthName={monthName.toLocaleLowerCase()}
            balances={monthlyData.balances}
            currentMemberId={currentMemberId}
            onOpenSettle={openSettle}
          />
        )
      )}

      {/* A one-time group ignores months entirely, so there is nothing to navigate. */}
      {!isOneTime && (
        /*
          En desktop, tres columnas: la cápsula del mes al centro y las acciones a la derecha. Con
          `1fr auto 1fr` la cápsula se corre en vez de quedar tapada cuando las acciones no entran.
        */
        <div className="relative flex items-center gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <span className="hidden lg:block" aria-hidden="true" />
          <MonthPager
            className="flex-1"
            year={year}
            month={month}
            onNavigate={setYearMonth}
            isSettled={isSettled}
            groupId={isOneTime ? undefined : groupId}
          />
          {/* Alta y transferencia en desktop; en mobile viven en el FAB. */}
          <div className="hidden shrink-0 items-center justify-end gap-2 lg:flex">
            <Button size="sm" variant="outline" className="h-8 rounded-pill px-3 text-xs"
              title={t('expenses.transfer')}
              onClick={() => { setShowTransfer(true); setShowAdd(false); setScanFile(null); }}>
              <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
              <span>{t('expenses.transfer')}</span>
            </Button>
            <button
              type="button"
              onClick={() => openSearch({ groupId, groupName: group?.name ?? '' })}
              aria-label={t('search.open')}
              className="glass flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-muted-1 transition-opacity hover:opacity-80"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <kbd className="font-sans text-[10.5px] font-bold">⌘K</kbd>
            </button>
            <Button size="sm" variant="outline" className="h-8 rounded-pill px-3 text-xs"
              title={t('scan.menuTitle')}
              onClick={scanPicker.pickAny}>
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              <span>{t('scan.menuTitle')}</span>
            </Button>
            <Button size="sm" className="h-8 rounded-pill bg-brand px-3 text-xs text-primary-foreground hover:bg-brand/90"
              title={t('expenses.add')}
              onClick={() => { setShowAdd(true); setShowTransfer(false); setEditingExpense(null); setScanFile(null); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              <span>{t('expenses.add')}</span>
            </Button>
          </div>
        </div>
      )}


      {/* Un mes cerrado se lee, no se edita: la lista se apaga y lo dice con una pastilla. */}
      <div
        className={cn(
          'overflow-hidden rounded-card border border-line bg-surface shadow-card transition-opacity',
          isSettled && 'opacity-[0.62]',
        )}
      >
        {loadingExpenses ? (
          <div className="space-y-2 p-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-1">{t('expenses.noExpenses')}</div>
        ) : (
          <>
            <ExpenseListHeader
              expenses={expenses}
              members={members}
              onSorted={handleSorted}
              monthLabel={monthName}
              isOneTime={isOneTime}
              onExportPdf={handleExportPDF}
              isSettled={isSettled}
            />
            {sortedExpenses.length === 0 ? (
              <div className="py-10 text-center text-[12.5px] text-muted-2">{t('expenses.noMatches')}</div>
            ) : (
              <div>
                {days.map(day => (
                  <div key={day.key}>
                    {/* El encabezado del día le da ritmo a la lista y saca la fecha de cada fila. */}
                    {day.heading && (
                      <p className="border-b border-line bg-surface-sunken/40 px-5 py-2 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
                        {day.heading}
                      </p>
                    )}
                    {day.expenses.map(e => (
                      <ExpenseRow key={e.id} expense={e} members={members} isSettled={isSettled}
                        autoOpenDetail={e.id === deepLinkedExpenseId}
                        highlight={e.id === highlightId}
                        groupId={groupId}
                        groupName={group?.name}
                        isOneTimeGroup={isOneTime}
                        viewedYear={year}
                        viewedMonth={month}
                        onEdit={exp => { setEditingExpense(exp); setShowAdd(true); }}
                        onDelete={handleDelete}
                        onRecurringDelete={templateId => setRecurringDeleteTarget(templateId)}
                        onRecurringEdit={exp => { setRecurringEditTarget(exp); setShowAdd(true); }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {scanPicker.inputs}
      <AddExpenseDialog
        isOneTimeGroup={isOneTime}
        open={showAdd || showTransfer}
        onOpenChange={v => {
          setShowAdd(v);
          setShowTransfer(v && showTransfer);
          if (!v) { setEditingExpense(null); setRecurringEditTarget(null); setScanFile(null); }
        }}
        scanFile={scanFile}
        onSubmit={recurringEditTarget ? handleRecurringUpdate : (editingExpense ? handleUpdate : handleCreate)}
        initialMode={showTransfer ? 'loan' : 'expense'}
        members={members}
        initialExpense={recurringEditTarget ?? editingExpense ?? undefined}
        isSettled={isSettled}
        currentMemberId={currentMemberId}
        groupId={groupId}
        onSuccess={refetch}
        isRecurringEdit={!!recurringEditTarget}
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
            <Button className="bg-brand hover:bg-brand/90 text-primary-foreground"
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

      {isOneTime && (
        <p className="px-1 text-[11.5px] font-medium leading-[1.45] text-muted-2">
          {t('expenses.eventFooter')}
        </p>
      )}

      {/* El plan. Marcar los pagos es otra pantalla; el cierre, la tarjeta de arriba. */}
      {monthlyData && !isSettled && (
        <SettleSheet
          open={showSettle}
          onOpenChange={setShowSettle}
          groupName={group?.name ?? ''}
          month={month}
          isOneTime={isOneTime}
          members={members}
          transfers={monthlyData.transfers ?? []}
          expenses={expenses}
          currentMemberId={currentMemberId}
          scope={scope}
          onMarkOneByOne={() => { setShowSettle(false); navigate(settleProgressPath); }}
        />
      )}

    </div>
  );
}
