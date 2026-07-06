import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingDown, Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import { useIsland } from '@/contexts/IslandContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { usePersonalContext } from '@/hooks/usePersonalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { ExpenseDetailDialog } from '@/components/expenses/ExpenseDetailDialog';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { ViewAllLink } from './ViewAllLink';
import {
  updateRecurringPersonalExpense,
  deleteRecurringPersonalExpense,
} from '@/api/personal';
import { updateExpense, deleteExpense } from '@/api/expenses';
import type { ExpenseResponse, ExpenseCreate, RecurringPersonalExpenseInstanceResponse, PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';

interface PersonalExpensesSectionProps {
  ledger: PersonalLedgerResponse;
  year: number;
  month: number;
  refetch: () => void;
  categories: CategoryWithEmoji[];
  /** Show only the latest N rows combined (dashboard); omit for the full page. */
  limit?: number;
  /** Target of the "View all" link; shown when there are more rows than `limit`. */
  viewAllTo?: string;
}

export function PersonalExpensesSection({ ledger, year, month, refetch, categories, limit, viewAllTo }: PersonalExpensesSectionProps) {
  const { t } = useTranslation();
  const island = useIsland();
  const { personalActions } = useFabActions();
  const { displayMode, setDisplayMode, blueRate, formatAmount } = useCurrency();
  const { personalGroupId, currentMemberId } = usePersonalContext();

  // One-off expense edit (creation lives in PersonalAddLauncher)
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);

  // Recurring expense edit state
  const [editingRecExpId, setEditingRecExpId] = useState<number | null>(null);
  const [editRecExpLabel, setEditRecExpLabel] = useState('');
  const [editRecExpAmount, setEditRecExpAmount] = useState('');
  const [editRecExpCategory, setEditRecExpCategory] = useState('');
  const [savingEditRecExp, setSavingEditRecExp] = useState(false);
  const [selectedRecurringInstance, setSelectedRecurringInstance] = useState<RecurringPersonalExpenseInstanceResponse | null>(null);

  // Confirmation dialog state — replaces window.confirm()
  const [confirm, setConfirm] = useState<{ title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void } | null>(null);

  // Recurring instances first (fixed monthly bills, API order), then one-offs latest-first.
  const recurring = ledger.recurringPersonalExpenses ?? [];
  const sortedOneOffs = [...(ledger.personalExpenses ?? [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  );
  const visibleRecurring = limit !== undefined ? recurring.slice(0, limit) : recurring;
  const visibleOneOffs = limit !== undefined
    ? sortedOneOffs.slice(0, Math.max(0, limit - recurring.length))
    : sortedOneOffs;
  const totalCount = recurring.length + sortedOneOffs.length;
  const hasMore = limit !== undefined && totalCount > limit;

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

  const handleSubmitExpense = async (data: ExpenseCreate) => {
    if (!personalGroupId || !editingExpense) return;
    const id = editingExpense.parentExpenseId ?? editingExpense.id;
    const { error } = await updateExpense(personalGroupId, id, data);
    if (error) { toast.error(error); return; }
    toast.success(t('toasts.expenseUpdated'));
    setEditingExpense(null);
    refetch();
    island.success();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-red-500" /> {t('personal.personalExpenses')}
          </h2>
          {blueRate !== null && (ledger.personalExpenses.some(e => e.currency === 'USD') || ledger.recurringPersonalExpenses.some(i => i.currency === 'USD')) && (
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
        <div className="flex items-center gap-2.5 shrink-0">
          {hasMore && viewAllTo && <ViewAllLink to={viewAllTo} count={totalCount} />}
          {/* Mobile adds via the floating + dial; desktop keeps these buttons */}
          <div className="hidden lg:flex gap-2">
            <Button variant="outline" size="sm" onClick={() => personalActions?.addExpense()}>
              <Plus className="h-3.5 w-3.5 mr-1" /><span>{t('expenses.add')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => personalActions?.addRecurringExpense()}>
              <Repeat className="h-3.5 w-3.5 mr-1" /><span>{t('personal.addRecurringExpense')}</span>
            </Button>
          </div>
        </div>
      </div>

      {ledger.personalExpenses.length === 0 && ledger.recurringPersonalExpenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('expenses.noExpenses')}</p>
      ) : (
        <div className="-mx-4">
          {/* Recurring personal expenses for this month */}
          {visibleRecurring.map(instance => {
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
          {visibleOneOffs.map(exp => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              members={currentMemberId ? [{ id: currentMemberId, name: 'Me', telephone: '' }] : []}
              isSettled={false}
              hideSplitBadge
              onEdit={e => setEditingExpense(e)}
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

      {/* Edit expense dialog (creation lives in PersonalAddLauncher) */}
      {editingExpense && personalGroupId && currentMemberId && (
        <AddExpenseDialog
          open={!!editingExpense}
          onOpenChange={open => { if (!open) setEditingExpense(null); }}
          onSubmit={handleSubmitExpense}
          members={[{ id: currentMemberId, name: 'Me', telephone: '' }]}
          initialExpense={editingExpense}
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
    </div>
  );
}
