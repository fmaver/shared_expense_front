import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { formatDate } from '@/utils/format';
import type { ExpenseCreate, ExpenseResponse, Member, SplitStrategy } from '@/types/expense';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: ExpenseCreate) => void;
  members: Member[];
  initialExpense?: ExpenseResponse;
  isSettled?: boolean;
  hidePayerAndSplit?: boolean;
}

function buildInitial(
  initialExpense: ExpenseResponse | undefined,
  members: Member[],
  firstCategory: string,
): ExpenseCreate {
  if (initialExpense) {
    const description = initialExpense.description.replace(/\s*\(\d+\/\d+\)\s*$/, '');
    const amount =
      initialExpense.paymentType === 'credit' && initialExpense.installments > 1
        ? initialExpense.amount * initialExpense.installments
        : initialExpense.amount;
    return {
      description,
      amount,
      date: initialExpense.date,
      category: { name: initialExpense.category },
      payerId: initialExpense.payerId,
      paymentType: initialExpense.paymentType,
      installments: initialExpense.installments,
      splitStrategy: {
        type: initialExpense.splitStrategy.type,
        ...(initialExpense.splitStrategy.type === 'percentage'
          ? { percentages: initialExpense.splitStrategy.percentages }
          : {}),
        ...(initialExpense.splitStrategy.type === 'exact'
          ? { amounts: initialExpense.splitStrategy.amounts }
          : {}),
        ...(initialExpense.splitStrategy.participantIds != null
          ? { participantIds: initialExpense.splitStrategy.participantIds }
          : {}),
      },
    };
  }
  return {
    description: '',
    amount: '' as unknown as number,
    date: formatDate(new Date()),
    category: { name: firstCategory },
    payerId: members[0]?.id ?? 0,
    paymentType: 'debit',
    installments: 1,
    splitStrategy: { type: 'equal', percentages: {} },
  };
}

export function AddExpenseDialog({
  open, onOpenChange, onSubmit, members, initialExpense, isSettled = false, hidePayerAndSplit = false,
}: AddExpenseDialogProps) {
  const { t } = useTranslation();
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const [expense, setExpense] = useState<ExpenseCreate>(() =>
    buildInitial(initialExpense, members, categories[0]?.name ?? ''));
  const [error, setError] = useState('');

  // Re-init when dialog opens with a different expense
  React.useEffect(() => {
    if (open) {
      setExpense(buildInitial(initialExpense, members, categories[0]?.name ?? ''));
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const exactTotal = useMemo(() => {
    if (expense.splitStrategy.type !== 'exact') return 0;
    return Object.values(expense.splitStrategy.amounts ?? {}).reduce(
      (s, v) => s + (v == null ? 0 : (v as number)), 0);
  }, [expense.splitStrategy]);

  const exactRemaining = Number(expense.amount ?? 0) - exactTotal;

  const set = (patch: Partial<ExpenseCreate>) => setExpense(prev => ({ ...prev, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expense.splitStrategy.type === 'exact' && Math.abs(exactRemaining) > 0.01) {
      setError(t('expenseForm.exactError'));
      return;
    }
    const { type, percentages, amounts, participantIds } = expense.splitStrategy;
    const splitStrategy: SplitStrategy = { type };
    if (type === 'percentage') {
      splitStrategy.percentages = Object.fromEntries(
        Object.entries(percentages ?? {}).map(([k, v]) => [k, v == null ? 0 : v]));
    } else if (type === 'exact') {
      splitStrategy.amounts = Object.fromEntries(
        Object.entries(amounts ?? {}).map(([k, v]) => [k, v == null ? 0 : v]));
    } else if (participantIds != null) {
      splitStrategy.participantIds = participantIds;
    }
    onSubmit({ ...expense, splitStrategy });
  };

  const disabled = isSettled;
  const isEdit = !!initialExpense;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-lg flex flex-col gap-0 overflow-hidden max-h-[90vh]" showCloseButton={false}>
        <DialogHeader className="px-0 pb-2">
          <DialogTitle>{isEdit ? t('expenseForm.editExpense') : t('expenseForm.addExpense')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
        <form id="expense-form" onSubmit={handleSubmit} className="space-y-4 py-1">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">{t('expenseForm.amount')}</Label>
            <Input id="amount" type="number" step="0.01" min="0" required
              placeholder="e.g. 4500" disabled={disabled}
              value={expense.amount === '' ? '' : expense.amount}
              onChange={e => set({ amount: e.target.value ? parseFloat(e.target.value) : '' as unknown as number })} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">{t('expenseForm.description')}</Label>
            <Input id="desc" required maxLength={255} disabled={disabled}
              value={expense.description}
              onChange={e => set({ description: e.target.value })} />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">{t('expenseForm.date')}</Label>
            <Input id="date" type="date" required disabled={disabled}
              value={expense.date}
              onChange={e => set({ date: e.target.value })} />
          </div>

          <div className={hidePayerAndSplit ? '' : 'grid grid-cols-2 gap-4'}>
            {/* Category */}
            <div className="space-y-1.5">
              <Label>{t('expenseForm.category')}</Label>
              <Select value={expense.category.name} disabled={loadingCats || disabled}
                onValueChange={v => set({ category: { name: v } })}>
                <SelectTrigger>
                  <span className="flex-1 text-left truncate">
                    {loadingCats ? t('common.loading') : (() => {
                      const c = categories.find(c => c.name === expense.category.name);
                      return c ? `${c.emoji} ${c.name}` : t('expenseForm.selectPlaceholder');
                    })()}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payer — hidden for single-member personal context */}
            {!hidePayerAndSplit && (
              <div className="space-y-1.5">
                <Label>{t('expenseForm.payer')}</Label>
                <Select value={String(expense.payerId)} disabled={disabled}
                  onValueChange={v => set({ payerId: parseInt(v) })}>
                  <SelectTrigger>
                    <span className="flex-1 text-left truncate">
                      {members.find(m => m.id === expense.payerId)?.name ?? 'Select…'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment type */}
            <div className="space-y-1.5">
              <Label>{t('expenseForm.paymentType')}</Label>
              <Select value={expense.paymentType} disabled={disabled}
                onValueChange={v => set({ paymentType: v as 'debit' | 'credit' })}>
                <SelectTrigger>
                  <span className="flex-1 text-left">{expense.paymentType === 'debit' ? t('expenseForm.debit') : t('expenseForm.credit')}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">{t('expenseForm.debit')}</SelectItem>
                  <SelectItem value="credit">{t('expenseForm.credit')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Installments (credit only) */}
            {expense.paymentType === 'credit' && (
              <div className="space-y-1.5">
                <Label htmlFor="installments">{t('expenseForm.installments')}</Label>
                <Input id="installments" type="number" min="1" required disabled={disabled}
                  value={expense.installments}
                  onChange={e => set({ installments: parseInt(e.target.value) || 1 })} />
              </div>
            )}
          </div>

          {!hidePayerAndSplit && <Separator />}

          {/* Split strategy — hidden for single-member personal context */}
          {!hidePayerAndSplit && (<>
          <div className="space-y-1.5">
            <Label>{t('expenseForm.splitType')}</Label>
            <Select value={expense.splitStrategy.type} disabled={disabled}
              onValueChange={val => {
                const type = val as SplitStrategy['type'];
                set({
                  splitStrategy: {
                    type,
                    percentages: type === 'percentage'
                      ? Object.fromEntries(members.map(m => [m.id.toString(), null]))
                      : null,
                    amounts: type === 'exact'
                      ? Object.fromEntries(members.map(m => [m.id.toString(), null]))
                      : null,
                    participantIds: null,
                  },
                });
              }}>
              <SelectTrigger>
                <span className="flex-1 text-left">
                  {{ equal: t('expenseForm.equal'), percentage: t('expenseForm.percentage'), exact: t('expenseForm.exact') }[expense.splitStrategy.type]}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">{t('expenseForm.equal')}</SelectItem>
                <SelectItem value="percentage">{t('expenseForm.percentage')}</SelectItem>
                <SelectItem value="exact">{t('expenseForm.exact')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equal — optional participant subset */}
          {expense.splitStrategy.type === 'equal' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('expenseForm.participants')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const ids = expense.splitStrategy.participantIds;
                  const checked = ids == null || ids.includes(m.id);
                  return (
                    <button key={m.id} type="button" disabled={disabled}
                      onClick={() => {
                        const current = expense.splitStrategy.participantIds ?? members.map(x => x.id);
                        const next = checked
                          ? current.filter(id => id !== m.id)
                          : [...current, m.id];
                        set({
                          splitStrategy: {
                            ...expense.splitStrategy,
                            participantIds: next.length === members.length ? null : next,
                          },
                        });
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                        checked
                          ? 'bg-primary/10 border-brand text-foreground'
                          : 'bg-muted border-border text-muted-foreground'
                      )}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Percentage inputs */}
          {expense.splitStrategy.type === 'percentage' && (
            <div className="space-y-2">
              <Label>{t('expenseForm.percentagesLabel')}</Label>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-sm w-24 truncate">{m.name}</span>
                  <Input type="number" min="0" max="100" step="0.01" required
                    placeholder="e.g. 50" disabled={disabled}
                    className="w-24"
                    value={expense.splitStrategy.percentages?.[m.id] == null ? ''
                      : expense.splitStrategy.percentages[m.id]}
                    onChange={e => {
                      const v = e.target.value === '' ? null : parseFloat(e.target.value);
                      set({ splitStrategy: {
                        ...expense.splitStrategy,
                        percentages: { ...expense.splitStrategy.percentages, [m.id]: v },
                      }});
                    }} />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ))}
            </div>
          )}

          {/* Exact amount inputs */}
          {expense.splitStrategy.type === 'exact' && (
            <div className="space-y-2">
              <Label>{t('expenseForm.exactLabel')}</Label>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-sm w-24 truncate">{m.name}</span>
                  <Input type="number" min="0" step="0.01" placeholder="0.00"
                    disabled={disabled} className="w-28"
                    value={expense.splitStrategy.amounts?.[m.id] == null ? ''
                      : expense.splitStrategy.amounts[m.id]}
                    onChange={e => {
                      const v = e.target.value === '' ? null : parseFloat(e.target.value);
                      set({ splitStrategy: {
                        ...expense.splitStrategy,
                        amounts: { ...expense.splitStrategy.amounts, [m.id]: v },
                      }});
                    }} />
                </div>
              ))}
              <p className={cn('text-xs font-medium', Math.abs(exactRemaining) <= 0.01 ? 'text-settle' : 'text-destructive')}>
                {Math.abs(exactRemaining) <= 0.01
                  ? t('expenseForm.amountsCorrect')
                  : exactRemaining > 0
                    ? t('expenseForm.unassigned', { amount: exactRemaining.toFixed(2) })
                    : t('expenseForm.overBy', { amount: Math.abs(exactRemaining).toFixed(2) })}
              </p>
            </div>
          )}
          </>)}
        </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button form="expense-form" type="submit" className="bg-brand hover:bg-brand/90 text-white"
            disabled={disabled}>
            {isEdit ? t('expenseForm.update') : t('expenseForm.addExpense')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
