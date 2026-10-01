import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TrendingDown, Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import { useIsland } from '@/contexts/IslandContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { capitalize, formatDayHeading } from '@/utils/format';
import { usePersonalContext } from '@/hooks/usePersonalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { ExpenseDetailDialog } from '@/components/expenses/ExpenseDetailDialog';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { ViewAllLink } from './ViewAllLink';
import { ShowMoreButton } from './ShowMoreButton';
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal';
import {
  updateRecurringPersonalExpense,
  deleteRecurringPersonalExpense,
} from '@/api/personal';
import { updateExpense, deleteExpense } from '@/api/expenses';
import type { ExpenseResponse, ExpenseCreate, RecurringPersonalExpenseInstanceResponse, PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';
import { FALLBACK_EMOJI } from '@/components/search/SearchResultRow';

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
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const weekdaysLong = t('weekdaysLong', { returnObjects: true }) as string[];
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
  const [editRecExpCurrency, setEditRecExpCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [savingEditRecExp, setSavingEditRecExp] = useState(false);
  const [selectedRecurringInstance, setSelectedRecurringInstance] = useState<RecurringPersonalExpenseInstanceResponse | null>(null);

  /*
    La búsqueda linkea a un gasto (`?expense=:id`) o a un fijo del mes (`?recurring=:instanceId`):
    se abre su detalle, igual que el deep link del grupo. El fijo se abre una sola vez por id, para
    que cerrarlo no lo vuelva a abrir con cada refetch del ledger.
  */
  const [searchParams] = useSearchParams();
  const deepLinkedExpenseId = Number(searchParams.get('expense')) || null;
  const deepLinkedRecurringId = Number(searchParams.get('recurring')) || null;
  const openedRecurringId = useRef<number | null>(null);
  useEffect(() => {
    if (deepLinkedRecurringId === null || openedRecurringId.current === deepLinkedRecurringId) return;
    const instance = (ledger.recurringPersonalExpenses ?? []).find(i => i.id === deepLinkedRecurringId);
    if (!instance) return;
    openedRecurringId.current = deepLinkedRecurringId;
    setSelectedRecurringInstance(instance);
  }, [deepLinkedRecurringId, ledger]);

  // Confirmation dialog state — replaces window.confirm()
  const [confirm, setConfirm] = useState<{ title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void } | null>(null);

  // Recurring instances first (fixed monthly bills, API order), then one-offs latest-first.
  const recurring = ledger.recurringPersonalExpenses ?? [];
  const sortedOneOffs = [...(ledger.personalExpenses ?? [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  );
  const totalCount = recurring.length + sortedOneOffs.length;
  const { visibleCount, hasMore, remaining, showAll } = useProgressiveReveal(limit, totalCount);
  const visibleRecurring = recurring.slice(0, visibleCount);
  const visibleOneOffs = sortedOneOffs.slice(0, Math.max(0, visibleCount - recurring.length));
  // Un bloque por día, como en los grupos (ya vienen ordenados de más nuevo a más viejo).
  const dayBuckets: { date: string; expenses: ExpenseResponse[] }[] = [];
  for (const exp of visibleOneOffs) {
    const last = dayBuckets[dayBuckets.length - 1];
    if (last && last.date === exp.date) last.expenses.push(exp);
    else dayBuckets.push({ date: exp.date, expenses: [exp] });
  }

  const handleSaveEditRecurringExpense = async (instance: RecurringPersonalExpenseInstanceResponse) => {
    if (!editRecExpLabel || !editRecExpAmount) return;
    setSavingEditRecExp(true);
    try {
      await updateRecurringPersonalExpense(instance.recurringExpenseId, {
        label: editRecExpLabel,
        amount: parseFloat(editRecExpAmount),
        categoryName: editRecExpCategory || instance.categoryName,
        currency: editRecExpCurrency,
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 min-w-0">
            <TrendingDown className="h-4 w-4 text-red-500 shrink-0" /> <span className="truncate">{t('personal.personalExpenses')}</span>
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
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {hasMore && viewAllTo && <ViewAllLink to={viewAllTo} count={totalCount} />}
          {/* Mobile adds via the floating + dial; desktop keeps these buttons */}
          <div className="hidden lg:flex gap-2">
            <Button variant="outline" size="sm" onClick={() => personalActions?.pick('expense')}>
              <Plus className="h-3.5 w-3.5 mr-1" /><span>{t('expenses.add')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => personalActions?.pick('fixed')}>
              <Repeat className="h-3.5 w-3.5 mr-1" /><span>{t('personal.addRecurringExpense')}</span>
            </Button>
          </div>
        </div>
      </div>

      {ledger.personalExpenses.length === 0 && ledger.recurringPersonalExpenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('expenses.noExpenses')}</p>
      ) : (
        <div className="-mx-4">
          {/* Como en los grupos: un encabezado por bloque. Los fijos no tienen día, van bajo
              "Cada mes"; los demás, agrupados por la fecha del gasto. */}
          {visibleRecurring.length > 0 && (
            <p className="border-b border-line bg-surface-sunken/40 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-1">{t('personal.fixedHeading')}</p>
          )}
          {/* Recurring personal expenses for this month */}
          {visibleRecurring.map(instance => {
            const catEmoji = categories.find(c => c.name === instance.categoryName)?.emoji;
            return (
            <div key={`rec-exp-${instance.id}`} className="border-b border-line last:border-b-0">
              <div
                className="group flex cursor-pointer touch-manipulation items-center gap-3 px-5 py-3 transition-colors [@media(hover:hover)]:hover:bg-brand-wash active:bg-brand-wash"
                onClick={() => setSelectedRecurringInstance(instance)}
              >
                {/* Mismo armado que ExpenseRow: emoji en su cuadrado, título y, abajo, el badge
                    "cada mes" con la categoría. Antes decía "Recurrente" dos veces (texto y
                    chip) y el monto quedaba a mitad de fila por un ancho fijo. */}
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] bg-surface-sunken">
                  <span className="text-[19px] leading-none">{catEmoji || FALLBACK_EMOJI}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">{instance.label}</p>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-chip bg-brand-wash px-1.5 py-0.5 text-[10.5px] font-bold leading-[1.4] text-brand-ink">
                      <Repeat className="h-2.5 w-2.5" aria-hidden="true" />
                      {t('expenses.badgeRecurring2')}
                    </span>
                    <p className="min-w-0 truncate text-[11.5px] font-medium leading-tight text-muted-2">
                      {capitalize(instance.categoryName)}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-right text-[13.5px] font-bold leading-tight tabular-nums text-foreground">
                  {formatAmount(instance.amount, instance.currency)}
                </p>
                {/* Actions */}
                <div
                  className="[@media(hover:none)]:hidden flex items-center gap-1 opacity-0 invisible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:visible transition-opacity flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setEditingRecExpId(instance.id); setEditRecExpLabel(instance.label); setEditRecExpAmount(String(instance.amount)); setEditRecExpCategory(instance.categoryName); setEditRecExpCurrency(instance.currency === 'USD' ? 'USD' : 'ARS'); }}>
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editRecExpAmount} onChange={e => setEditRecExpAmount(e.target.value)} />
                      <CurrencyToggle value={editRecExpCurrency} onChange={setEditRecExpCurrency} />
                    </div>
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
                      <Button size="sm" className="h-6 text-xs px-2 bg-brand hover:bg-brand/90 text-primary-foreground"
                        disabled={savingEditRecExp} onClick={() => handleSaveEditRecurringExpense(instance)}>
                        {savingEditRecExp ? '…' : t('common.save')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );})}
          {dayBuckets.map(bucket => (
            <div key={bucket.date}>
              <p className="border-b border-line bg-surface-sunken/40 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-1">
                {formatDayHeading(bucket.date, monthsShort, weekdaysLong)}
              </p>
              {bucket.expenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                autoOpenDetail={exp.id === deepLinkedExpenseId}
                members={currentMemberId ? [{ id: currentMemberId, name: 'Me', telephone: '' }] : []}
                isSettled={false}
                hideSplitBadge
                /* En la lista personal pagás siempre vos: el lugar del avatar lo ocupa la categoría. */
                variant="category"
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
          ))}
          {hasMore && (
            <div className="px-4">
              <ShowMoreButton remaining={remaining} onClick={showAll} />
            </div>
          )}
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
