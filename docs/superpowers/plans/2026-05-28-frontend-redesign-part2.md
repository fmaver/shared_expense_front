# Jirens Frontend Redesign — Implementation Plan (Part 2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** All tasks in `docs/superpowers/plans/2026-05-28-frontend-redesign-part1.md` must be complete and `npm run build` must pass before starting here.

**Goal:** Build the remaining feature components (expense list, forms, members, settings, profile, public pages), perform the App.tsx routing cutover, then remove MUI and delete old files.

**Architecture:** Tasks 11–20 build new components alongside the old ones. Task 21 does the single routing cutover in `App.tsx` — after that the old components are no longer imported. Task 22 removes MUI and deletes them.

**Spec:** `docs/superpowers/specs/2026-05-27-frontend-redesign-design.md`

---

## Files created / modified in Part 2

```
src/components/expenses/ExpenseRow.tsx          new
src/components/expenses/ExpenseListHeader.tsx   new
src/components/expenses/AddExpenseDialog.tsx    new
src/components/expenses/TransferDialog.tsx      new
src/pages/ExpensesDashboard.tsx                 new
src/pages/GroupLayout.tsx                       new  (tab container)
src/pages/GroupMembersPage.tsx                  new
src/pages/GroupSettingsPage.tsx                 new
src/pages/ProfilePage.tsx                       new
src/public-pages/InvitationLanding.tsx          new
src/public-pages/GroupJoinLanding.tsx           new
src/components/members/InviteDialog.tsx         new
src/components/members/JoinLinkCard.tsx         new
src/App.tsx                                     replaced (Task 21)
package.json                                    modified (Task 22 — remove MUI)
src/components/Login.tsx                        deleted (Task 22)
src/components/GroupSelector.tsx                deleted (Task 22)
src/components/GroupLayout.tsx                  deleted (Task 22)
src/components/ExpensesDashboard.tsx            deleted (Task 22)
src/components/ExpenseContent.tsx               deleted (Task 22)
src/components/ExpenseHeader.tsx                deleted (Task 22)
src/components/ExpenseList.tsx                  deleted (Task 22)
src/components/BalanceSummary.tsx               deleted (Task 22)
src/components/MonthPicker.tsx                  deleted (Task 22)
src/components/FormModal.tsx                    deleted (Task 22)
src/components/ConfirmationModal.tsx            deleted (Task 22)
src/components/Toast.tsx                        deleted (Task 22)
src/components/LoadingSpinner.tsx               deleted (Task 22)
src/components/LoadingState.tsx                 deleted (Task 22)
src/components/GroupMembers.tsx                 deleted (Task 22)
src/components/GroupSettings.tsx                deleted (Task 22)
src/components/CreateGroupModal.tsx             deleted (Task 22)
src/components/Profile.tsx                      deleted (Task 22)
src/components/InvitationLanding.tsx            deleted (Task 22)
src/components/GroupJoinLanding.tsx             deleted (Task 22)
src/components/ExpenseForm.tsx                  deleted (Task 22)
src/components/MoneyTransferForm.tsx            deleted (Task 22)
```

---

### Task 11: ExpenseRow with badge chips

**Files:** `src/components/expenses/ExpenseRow.tsx`

The badge chip colours follow the spec: split type uses a coloured background, category is muted. Sorting is done externally by `ExpenseListHeader` — this component is a pure row renderer.

- [ ] **Step 1: Create `src/components/expenses/ExpenseRow.tsx`**

```tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, capitalize, formatDate } from '@/utils/format';
import type { ExpenseResponse, Member } from '@/types/expense';

const SPLIT_BADGE: Record<string, string> = {
  equal:      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  percentage: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  exact:      'bg-sky-100    text-sky-700    dark:bg-sky-900/40    dark:text-sky-300',
};

const PAYMENT_BADGE: Record<string, string> = {
  debit:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  credit: 'bg-blue-100    text-blue-700    dark:bg-blue-900/40    dark:text-blue-300',
};

interface ExpenseRowProps {
  expense: ExpenseResponse;
  members: Member[];
  isSettled: boolean;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
}

function memberName(members: Member[], id: number) {
  return members.find(m => m.id === id)?.name ?? 'Unknown';
}

export function ExpenseRow({ expense, members, isSettled, onEdit, onDelete }: ExpenseRowProps) {
  const canEdit = expense.installmentNo === 1;

  const splitLabel = (() => {
    if (expense.splitStrategy.type === 'equal' && expense.splitStrategy.participantIds?.length) {
      return `equal (${expense.splitStrategy.participantIds.length})`;
    }
    return expense.splitStrategy.type;
  })();

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors group">
      {/* Category icon */}
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-base flex-shrink-0">
        {/* categories don't have emojis in the response — use first letter as fallback */}
        <span className="text-xs font-bold text-muted-foreground uppercase">
          {expense.category.slice(0, 2)}
        </span>
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{capitalize(expense.description)}</p>
        <p className="text-xs text-muted-foreground">
          {memberName(members, expense.payerId)} · {formatDate(expense.date, true)}
        </p>
      </div>

      {/* Badges */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', SPLIT_BADGE[expense.splitStrategy.type])}>
          {splitLabel}
        </span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
          {expense.paymentType}
          {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {capitalize(expense.category)}
        </span>
      </div>

      {/* Amount */}
      <div className="text-sm font-semibold text-foreground tabular-nums flex-shrink-0 w-24 text-right">
        {formatCurrency(expense.amount)}
        {expense.paymentType === 'credit' && expense.installments > 1 && (
          <div className="text-[10px] text-muted-foreground font-normal">
            of {formatCurrency(expense.amount * expense.installments)}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isSettled && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            disabled={!canEdit}
            title={canEdit ? 'Edit' : 'Edit the first installment only'}
            onClick={() => canEdit && onEdit(expense)}>
            <Pen className={cn('h-3.5 w-3.5', canEdit ? 'text-muted-foreground' : 'text-muted-foreground/30')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            disabled={!canEdit}
            title={canEdit ? 'Delete' : 'Delete the first installment only'}
            onClick={() => canEdit && onDelete(expense)}>
            <Trash2 className={cn('h-3.5 w-3.5', canEdit ? 'text-destructive' : 'text-muted-foreground/30')} />
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/expenses/ExpenseRow.tsx
git commit -m "feat: ExpenseRow with badge chips"
```

---

### Task 12: ExpenseListHeader — sort and filter toolbar

**Files:** `src/components/expenses/ExpenseListHeader.tsx`

This component owns sort state internally and exposes the sorted+filtered list to its parent via `onSorted`. It preserves all sort fields from the original `ExpenseList.tsx`.

- [ ] **Step 1: Create `src/components/expenses/ExpenseListHeader.tsx`**

```tsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpenseResponse, Member } from '@/types/expense';

type SortField = 'date' | 'description' | 'amount' | 'category' | 'payer' | 'paymentType' | 'splitStrategy';
type SortOrder = 'asc' | 'desc';

interface ExpenseListHeaderProps {
  expenses: ExpenseResponse[];
  members: Member[];
  onSorted: (sorted: ExpenseResponse[]) => void;
}

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'date',          label: 'Date' },
  { value: 'amount',        label: 'Amount' },
  { value: 'description',   label: 'Description' },
  { value: 'category',      label: 'Category' },
  { value: 'payer',         label: 'Payer' },
  { value: 'paymentType',   label: 'Payment type' },
  { value: 'splitStrategy', label: 'Split type' },
];

export function ExpenseListHeader({ expenses, members, onSorted }: ExpenseListHeaderProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterPayer, setFilterPayer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? 'Unknown';

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  const sorted = useMemo(() => {
    const filtered = expenses.filter(e => {
      if (filterPayer !== 'all' && e.payerId !== parseInt(filterPayer)) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':          cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'description':   cmp = a.description.localeCompare(b.description); break;
        case 'amount':        cmp = a.amount - b.amount; break;
        case 'category':      cmp = a.category.localeCompare(b.category); break;
        case 'payer':         cmp = memberName(a.payerId).localeCompare(memberName(b.payerId)); break;
        case 'paymentType':   cmp = a.paymentType.localeCompare(b.paymentType); break;
        case 'splitStrategy': cmp = a.splitStrategy.type.localeCompare(b.splitStrategy.type); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, sortField, sortOrder, filterPayer, filterCategory]);

  // Propagate sorted list upward whenever it changes
  React.useEffect(() => { onSorted(sorted); }, [sorted, onSorted]);

  const toggleOrder = () => setSortOrder(o => o === 'asc' ? 'desc' : 'asc');

  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
      {/* Sort field */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Sort</span>
        <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
          <SelectTrigger className="h-7 text-xs w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_FIELDS.map(f => (
              <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleOrder}
          aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
          <SortIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Filter by payer */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Payer</span>
        <Select value={filterPayer} onValueChange={setFilterPayer}>
          <SelectTrigger className="h-7 text-xs w-28 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id.toString()} className="text-xs">{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter by category */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Category</span>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-7 text-xs w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/expenses/ExpenseListHeader.tsx
git commit -m "feat: ExpenseListHeader with sort and filter"
```

---

### Task 13: AddExpenseDialog

This ports the complete logic from `src/components/ExpenseForm.tsx` into a shadcn Dialog. Read that file before implementing — the state shape and `handleSubmit` logic are preserved exactly.

**Files:** `src/components/expenses/AddExpenseDialog.tsx`

- [ ] **Step 1: Read the existing form logic**

```bash
cat src/components/ExpenseForm.tsx
```

Key things to carry over verbatim:
- Initial state setup (edit mode strips installment suffix, recalculates credit total)
- `exactTotal` / `exactRemaining` memo
- `handleSubmit` split-strategy normalisation

- [ ] **Step 2: Create `src/components/expenses/AddExpenseDialog.tsx`**

```tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  open, onOpenChange, onSubmit, members, initialExpense, isSettled = false,
}: AddExpenseDialogProps) {
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
      setError('Exact amounts must add up to the total.');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expense' : 'Add expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" min="0" required
              placeholder="e.g. 4500" disabled={disabled}
              value={expense.amount === '' ? '' : expense.amount}
              onChange={e => set({ amount: e.target.value ? parseFloat(e.target.value) : '' as unknown as number })} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" required maxLength={255} disabled={disabled}
              value={expense.description}
              onChange={e => set({ description: e.target.value })} />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" required disabled={disabled}
              value={expense.date}
              onChange={e => set({ date: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={expense.category.name} disabled={loadingCats || disabled}
                onValueChange={v => set({ category: { name: v } })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payer */}
            <div className="space-y-1.5">
              <Label>Payer</Label>
              <Select value={String(expense.payerId)} disabled={disabled}
                onValueChange={v => set({ payerId: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment type */}
            <div className="space-y-1.5">
              <Label>Payment type</Label>
              <Select value={expense.paymentType} disabled={disabled}
                onValueChange={v => set({ paymentType: v as 'debit' | 'credit' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Installments (credit only) */}
            {expense.paymentType === 'credit' && (
              <div className="space-y-1.5">
                <Label htmlFor="installments">Installments</Label>
                <Input id="installments" type="number" min="1" required disabled={disabled}
                  value={expense.installments}
                  onChange={e => set({ installments: parseInt(e.target.value) || 1 })} />
              </div>
            )}
          </div>

          <Separator />

          {/* Split strategy */}
          <div className="space-y-1.5">
            <Label>Split type</Label>
            <Select value={expense.splitStrategy.type} disabled={disabled}
              onValueChange={t => {
                const type = t as SplitStrategy['type'];
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
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="exact">Exact amounts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equal — optional participant subset */}
          {expense.splitStrategy.type === 'equal' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Participants (leave all checked for a full equal split)
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
              <Label>Percentages (must sum to 100)</Label>
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
              <Label>Exact amounts</Label>
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
                  ? '✓ Amounts add up correctly'
                  : exactRemaining > 0
                    ? `$${exactRemaining.toFixed(2)} still unassigned`
                    : `Over by $${Math.abs(exactRemaining).toFixed(2)}`}
              </p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="" className="bg-brand hover:bg-brand/90 text-white"
            disabled={disabled}
            onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isEdit ? 'Update expense' : 'Add expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/AddExpenseDialog.tsx
git commit -m "feat: AddExpenseDialog with all split types"
```

---

### Task 14: TransferDialog

Read `src/components/MoneyTransferForm.tsx` to confirm the exact field names and API payload it builds (category `prestamo`, equal split with `participantIds: [recipient.id]`).

**Files:** `src/components/expenses/TransferDialog.tsx`

- [ ] **Step 1: Read the source**

```bash
cat src/components/MoneyTransferForm.tsx
```

- [ ] **Step 2: Create `src/components/expenses/TransferDialog.tsx`**

```tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/format';
import type { ExpenseCreate, Member } from '@/types/expense';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: ExpenseCreate) => void;
  members: Member[];
}

export function TransferDialog({ open, onOpenChange, onSubmit, members }: TransferDialogProps) {
  const [payerId, setPayerId] = useState<number>(members[0]?.id ?? 0);
  const [recipientId, setRecipientId] = useState<number>(members[1]?.id ?? members[0]?.id ?? 0);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payerId === recipientId) { setError('Payer and recipient must be different.'); return; }
    setError('');
    setIsLoading(true);
    const payerName = members.find(m => m.id === payerId)?.name ?? '';
    const recipientName = members.find(m => m.id === recipientId)?.name ?? '';
    const expense: ExpenseCreate = {
      description: `Prestamo de ${payerName} a ${recipientName}`,
      amount: parseFloat(amount),
      date,
      category: { name: 'prestamo' },
      payerId,
      paymentType: 'debit',
      installments: 1,
      splitStrategy: { type: 'equal', participantIds: [recipientId] },
    };
    try {
      await onSubmit(expense);
      setAmount('');
      onOpenChange(false);
    } catch {
      setError('Failed to create transfer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Money transfer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1.5">
            <Label>Lender (who paid)</Label>
            <Select value={String(payerId)} onValueChange={v => setPayerId(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Borrower (who owes)</Label>
            <Select value={String(recipientId)} onValueChange={v => setRecipientId(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-amount">Amount</Label>
            <Input id="transfer-amount" type="number" step="0.01" min="0" required
              placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-date">Date</Label>
            <Input id="transfer-date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={isLoading}
            onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isLoading ? 'Saving…' : 'Save transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/TransferDialog.tsx
git commit -m "feat: TransferDialog"
```

---

### Task 15: ExpensesDashboard page

This assembles all expense components. It ports the orchestration logic from the old `src/components/ExpensesDashboard.tsx` and `src/components/ExpenseContent.tsx`.

**Files:** `src/pages/ExpensesDashboard.tsx`

- [ ] **Step 1: Read sources**

```bash
cat src/components/ExpensesDashboard.tsx
cat src/components/ExpenseContent.tsx
```

Note: `checkSimilarExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, `settleMonthlyShare`, `unsettleMonthlyShare`, `recalculateMonthlyShare` are all preserved from existing API modules.

- [ ] **Step 2: Create `src/pages/ExpensesDashboard.tsx`**

```tsx
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useGroupMembers } from '@/hooks/useMembers';
import {
  checkSimilarExpenses, createExpense, updateExpense, deleteExpense,
} from '@/api/expenses';
import {
  settleMonthlyShare, unsettleMonthlyShare, recalculateMonthlyShare,
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
import { exportToPDF } from '@/utils/export';

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
  const [isRecalculating, setIsRecalculating] = useState(false);

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
      await settleMonthlyShare(groupId, year, month);
      refetch(); toast.success('Month settled');
    } catch { toast.error('Failed to settle'); }
    finally { setIsSettling(false); }
  };

  const handleUnsettle = async () => {
    setIsUnsettling(true);
    try {
      await unsettleMonthlyShare(groupId, year, month);
      refetch(); toast.success('Month reopened');
    } catch { toast.error('Failed to reopen'); }
    finally { setIsUnsettling(false); }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateMonthlyShare(groupId, year, month);
      refetch(); toast.success('Balances recalculated');
    } catch { toast.error('Failed to recalculate'); }
    finally { setIsRecalculating(false); }
  };

  const handleSorted = useCallback((s: ExpenseResponse[]) => setSortedExpenses(s), []);

  if (loadingMembers) {
    return <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Month picker */}
      <MonthPicker year={year} month={month} onNavigate={(y, m) => { setYear(y); setMonth(m); }} />

      {/* Balance panel */}
      {monthlyData && (
        <BalancePanel
          balances={monthlyData.balances}
          members={members}
          isSettled={isSettled}
          onSettle={handleSettle} isSettling={isSettling}
          onUnsettle={handleUnsettle} isUnsettling={isUnsettling}
          onRecalculate={handleRecalculate} isRecalculating={isRecalculating}
          expenses={expenses}
        />
      )}

      {/* Expense list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Expenses</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
              onClick={() => monthlyData && exportToPDF(expenses, members, year, month)}>
              Export PDF
            </Button>
            <Button size="sm" variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => { setShowTransfer(true); setShowAdd(false); }}>
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> Transfer
            </Button>
            <Button size="sm"
              className="h-7 px-2.5 text-xs bg-brand hover:bg-brand/90 text-white"
              onClick={() => { setShowAdd(true); setShowTransfer(false); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
            </Button>
          </div>
        </div>

        {loadingExpenses ? (
          <div className="p-4 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
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

      {/* Add / Edit dialog */}
      <AddExpenseDialog
        open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) setEditingExpense(null); }}
        onSubmit={editingExpense ? handleUpdate : handleCreate}
        members={members}
        initialExpense={editingExpense ?? undefined}
        isSettled={isSettled}
      />

      {/* Transfer dialog */}
      <TransferDialog
        open={showTransfer} onOpenChange={setShowTransfer}
        onSubmit={handleCreate} members={members}
      />

      {/* Duplicate confirmation dialog */}
      <Dialog open={duplicates.length > 0} onOpenChange={open => { if (!open) { setPendingExpense(null); setDuplicates([]); } }}>
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
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/ExpensesDashboard.tsx
git commit -m "feat: ExpensesDashboard page"
```

---

### Task 16: GroupLayout (tab container)

**Files:** `src/pages/GroupLayout.tsx`

- [ ] **Step 1: Create `src/pages/GroupLayout.tsx`**

```tsx
import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useGroup } from '@/hooks/useGroups';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = [
  { label: 'Expenses', path: '' },
  { label: 'Members',  path: 'members' },
  { label: 'Settings', path: 'settings' },
];

export function GroupLayout() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { data: group, isLoading } = useGroup(groupId);

  return (
    <div className="flex flex-col h-full">
      {/* Group header + tabs */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 pt-4 pb-0">
          {isLoading ? (
            <Skeleton className="h-6 w-40 mb-3" />
          ) : (
            <h2 className="text-lg font-bold text-foreground mb-3">{group?.name}</h2>
          )}
          <nav className="-mb-px flex gap-0">
            {TABS.map(tab => (
              <NavLink
                key={tab.label}
                to={tab.path === '' ? `/groups/${groupId}` : `/groups/${groupId}/${tab.path}`}
                end={tab.path === ''}
                className={({ isActive }) => cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/GroupLayout.tsx
git commit -m "feat: GroupLayout tab container"
```

---

### Task 17: GroupMembersPage, InviteDialog, JoinLinkCard

**Files:** `src/pages/GroupMembersPage.tsx`, `src/components/members/InviteDialog.tsx`, `src/components/members/JoinLinkCard.tsx`

Read `src/components/GroupMembers.tsx` before implementing to understand the existing API calls: `getGroupMembers`, `createInvitation`, `getInvitations`, `revokeInvitation`, `createJoinLink`, `rotateJoinLink`, `leaveGroup`.

- [ ] **Step 1: Create `src/components/members/InviteDialog.tsx`**

```tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createInvitation } from '@/api/groups';
import { toast } from 'sonner';
import type { InvitationChannel } from '@/types/expense';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onInvited: () => void;
}

export function InviteDialog({ open, onOpenChange, groupId, onInvited }: InviteDialogProps) {
  const [channel, setChannel] = useState<InvitationChannel>('email');
  const [target, setTarget] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createInvitation(groupId, { channel, target: target.trim() });
      toast.success('Invitation sent');
      setTarget('');
      onInvited();
      onOpenChange(false);
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Invite member</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={v => setChannel(v as InvitationChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target">{channel === 'email' ? 'Email address' : 'WhatsApp number'}</Label>
            <Input id="target" required
              type={channel === 'email' ? 'email' : 'tel'}
              placeholder={channel === 'email' ? 'user@example.com' : '541138718498'}
              value={target} onChange={e => setTarget(e.target.value)} />
            {channel === 'phone' && (
              <p className="text-xs text-muted-foreground">Include country code, no + sign.</p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={isLoading}
            onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isLoading ? 'Sending…' : 'Send invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `src/components/members/JoinLinkCard.tsx`**

```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createJoinLink, rotateJoinLink } from '@/api/groups';
import { toast } from 'sonner';
import { Copy, RefreshCw, Link } from 'lucide-react';
import type { GroupJoinLink } from '@/types/expense';

interface JoinLinkCardProps {
  groupId: number;
  joinLink: GroupJoinLink | null;
  onRefresh: () => void;
}

export function JoinLinkCard({ groupId, joinLink, onRefresh }: JoinLinkCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getOrCreate = async () => {
    setIsLoading(true);
    try {
      await createJoinLink(groupId);
      onRefresh();
    } catch { toast.error('Failed to create join link'); }
    finally { setIsLoading(false); }
  };

  const rotate = async () => {
    setIsLoading(true);
    try {
      await rotateJoinLink(groupId);
      onRefresh();
      toast.success('Join link rotated');
    } catch { toast.error('Failed to rotate link'); }
    finally { setIsLoading(false); }
  };

  const copy = () => {
    if (joinLink?.url) {
      navigator.clipboard.writeText(joinLink.url);
      toast.success('Link copied');
    }
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">Shareable join link</h4>
      </div>
      {joinLink ? (
        <>
          <p className="text-xs text-muted-foreground break-all font-mono bg-muted px-2 py-1.5 rounded-md">
            {joinLink.url}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
              <Copy className="h-3 w-3 mr-1.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={rotate} disabled={isLoading}>
              <RefreshCw className="h-3 w-3 mr-1.5" /> Rotate
            </Button>
          </div>
        </>
      ) : (
        <Button size="sm" className="h-7 text-xs bg-brand hover:bg-brand/90 text-white"
          onClick={getOrCreate} disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create join link'}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/pages/GroupMembersPage.tsx`**

Read `src/components/GroupMembers.tsx` to understand data fetching. It uses `getGroupMembers` (or `useGroupMembers`), `getInvitations`, `revokeInvitation`, `createJoinLink`, `rotateJoinLink`, `leaveGroup`. Use the same hooks/API calls.

```tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupMembers } from '@/hooks/useMembers';
import { getInvitations, revokeInvitation, leaveGroup } from '@/api/groups';
import { InviteDialog } from '@/components/members/InviteDialog';
import { JoinLinkCard } from '@/components/members/JoinLinkCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, X, LogOut } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import type { Invitation, GroupJoinLink } from '@/types/expense';

// Simple one-shot async hook
function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; refetch: () => void } {
  const [data, setData] = React.useState<T | null>(null);
  const run = React.useCallback(async () => {
    try { setData(await fn()); } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  React.useEffect(() => { run(); }, [run]);
  return { data, refetch: run };
}

export function GroupMembersPage() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const navigate = useNavigate();

  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const { data: invitations, refetch: refetchInvitations } = useAsync<Invitation[]>(
    () => getInvitations(groupId).then(r => r.data ?? []), [groupId]);
  const [joinLink, setJoinLink] = useState<GroupJoinLink | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRevoke = async (token: string) => {
    try {
      await revokeInvitation(groupId, token);
      refetchInvitations();
      toast.success('Invitation revoked');
    } catch { toast.error('Failed to revoke'); }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGroup(groupId);
      toast.success('Left group');
      navigate('/groups');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? 'Cannot leave group — you may have an outstanding balance.');
    } finally {
      setIsLeaving(false); setShowLeave(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Member list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Members</h3>
          <Button size="sm" className="h-7 text-xs bg-brand hover:bg-brand/90 text-white"
            onClick={() => setShowInvite(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Invite
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {members.map(m => (
              <div key={m.memberId} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center text-xs font-bold text-brand">
                    {m.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    {(m.email || m.telephone) && (
                      <p className="text-xs text-muted-foreground">{m.email ?? m.telephone}</p>
                    )}
                  </div>
                </div>
                {m.isStub && <Badge variant="secondary" className="text-xs">Pending</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending invitations</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">{inv.target}</p>
                  <p className="text-xs text-muted-foreground capitalize">{inv.channel}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRevoke(inv.shareUrl.split('/').pop()!)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join link */}
      <JoinLinkCard groupId={groupId} joinLink={joinLink}
        onRefresh={async () => {
          const { createJoinLink } = await import('@/api/groups');
          try { const r = await createJoinLink(groupId); setJoinLink(r.data ?? null); } catch {}
        }} />

      <Separator />

      {/* Leave group */}
      <div>
        <Button variant="outline" size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setShowLeave(true)}>
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Leave group
        </Button>
      </div>

      <InviteDialog open={showInvite} onOpenChange={setShowInvite}
        groupId={groupId} onInvited={refetchInvitations} />

      <Dialog open={showLeave} onOpenChange={setShowLeave}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Leave group?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            You'll lose access to this group's expenses and history. This is blocked if you have an outstanding balance.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeave(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? 'Leaving…' : 'Leave group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Note on `useAsync`:** The inline `useAsync` hook at the top of the file above is self-contained. If a `useAsync` hook already exists in `src/hooks/`, import it from there instead and remove the inline definition.

- [ ] **Step 4: Verify**

```bash
npm run build
```

Fix any import errors (the `getInvitations`, `revokeInvitation`, `leaveGroup`, `createJoinLink`, `rotateJoinLink` functions — verify their exact signatures in `src/api/groups.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/pages/GroupMembersPage.tsx src/components/members/InviteDialog.tsx src/components/members/JoinLinkCard.tsx
git commit -m "feat: GroupMembersPage, InviteDialog, JoinLinkCard"
```

---

### Task 18: GroupSettingsPage

**Files:** `src/pages/GroupSettingsPage.tsx`

Read `src/components/GroupSettings.tsx` to confirm the `updateGroup` API call signature.

- [ ] **Step 1: Create `src/pages/GroupSettingsPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroup } from '@/hooks/useGroups';
import { updateGroup, leaveGroup, createJoinLink, rotateJoinLink } from '@/api/groups';
import { JoinLinkCard } from '@/components/members/JoinLinkCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import type { GroupJoinLink } from '@/types/expense';

export function GroupSettingsPage() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const navigate = useNavigate();
  const { data: group, refetch } = useGroup(groupId);

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [joinLink, setJoinLink] = useState<GroupJoinLink | null>(null);
  const [showLeave, setShowLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  React.useEffect(() => { if (group) setName(group.name); }, [group]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateGroup(groupId, { name: name.trim() });
      refetch(); toast.success('Group renamed');
    } catch { toast.error('Failed to rename group'); }
    finally { setIsSaving(false); }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGroup(groupId);
      toast.success('Left group'); navigate('/groups');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? 'Cannot leave — you may have an outstanding balance.');
    } finally { setIsLeaving(false); setShowLeave(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Rename */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Group name</h3>
        <form onSubmit={handleRename} className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="gname" className="sr-only">Group name</Label>
            <Input id="gname" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <Button type="submit" className="bg-brand hover:bg-brand/90 text-white flex-shrink-0" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </div>

      {/* Join link */}
      <JoinLinkCard groupId={groupId} joinLink={joinLink}
        onRefresh={async () => {
          try { const r = await createJoinLink(groupId); setJoinLink(r.data ?? null); } catch {}
        }} />

      <Separator />

      {/* Danger zone */}
      <div>
        <h3 className="text-sm font-semibold text-destructive mb-3">Danger zone</h3>
        <Button variant="outline" size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setShowLeave(true)}>
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Leave group
        </Button>
      </div>

      <Dialog open={showLeave} onOpenChange={setShowLeave}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Leave group?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            You'll lose access to this group. Blocked if you have an outstanding balance.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeave(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? 'Leaving…' : 'Leave group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/GroupSettingsPage.tsx
git commit -m "feat: GroupSettingsPage"
```

---

### Task 19: ProfilePage

Read `src/components/Profile.tsx` to confirm the API calls (`getMe`, `updateMe`, `changePassword`).

**Files:** `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Read source**

```bash
cat src/components/Profile.tsx
```

- [ ] **Step 2: Create `src/pages/ProfilePage.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { getMe, updateMe, changePassword } from '@/api/members';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [notificationPref, setNotificationPref] = useState('NONE');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    getMe().then(r => {
      if (r.data) {
        setName(r.data.name ?? '');
        setEmail(r.data.email ?? '');
        setTelephone(r.data.telephone ?? '');
        setNotificationPref(r.data.notificationPreference ?? 'NONE');
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateMe({ name, email, telephone: telephone.trim() || null, notificationPreference: notificationPref });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setIsSavingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed');
    } catch { toast.error('Failed to change password — check your current password'); }
    finally { setIsSavingPassword(false); }
  };

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 py-10 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-xl font-bold text-foreground">Profile</h1>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pname">Full name</Label>
          <Input id="pname" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pemail">Email</Label>
          <Input id="pemail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pphone">WhatsApp phone</Label>
          <Input id="pphone" type="tel" placeholder="e.g. 541138718498"
            value={telephone} onChange={e => setTelephone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Notification preference</Label>
          <Select value={notificationPref} onValueChange={setNotificationPref}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="NONE">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={isSavingProfile}>
          {isSavingProfile ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      <Separator />

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Change password</h2>
        <div className="space-y-1.5">
          <Label htmlFor="curpass">Current password</Label>
          <Input id="curpass" type="password" required value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newpass">New password</Label>
          <Input id="newpass" type="password" required minLength={6} value={newPassword}
            onChange={e => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confpass">Confirm new password</Label>
          <Input id="confpass" type="password" required value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={isSavingPassword}>
          {isSavingPassword ? 'Changing…' : 'Change password'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Fix any import issues — confirm `getMe`, `updateMe`, `changePassword` signatures in `src/api/members.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat: ProfilePage"
```

---

### Task 20: Public pages — InvitationLanding and GroupJoinLanding

Read the existing `src/components/InvitationLanding.tsx` and `src/components/GroupJoinLanding.tsx` — they contain all the resolve/accept/join API logic. Port it directly into the new files with the new design (centered card, no sidebar).

**Files:** `src/public-pages/InvitationLanding.tsx`, `src/public-pages/GroupJoinLanding.tsx`

- [ ] **Step 1: Read sources**

```bash
cat src/components/InvitationLanding.tsx
cat src/components/GroupJoinLanding.tsx
```

- [ ] **Step 2: Create `src/public-pages/InvitationLanding.tsx`**

Port all state and API logic unchanged. Replace the MUI/old Tailwind JSX with the new design pattern: centered card matching `LoginPage` style, shadcn `Input`/`Button`/`Label`.

The card header should show:
```
✦ Jirens
You've been invited to join: [groupName]
Invited by: [inviterName]
```

Use `Button` with `bg-brand` for the accept action.

- [ ] **Step 3: Create `src/public-pages/GroupJoinLanding.tsx`**

Same pattern: port logic unchanged, apply `LoginPage`-style centered card layout.

- [ ] **Step 4: Verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/public-pages/
git commit -m "feat: InvitationLanding and GroupJoinLanding redesigned"
```

---

### Task 21: App.tsx routing cutover

This is the single switch from old components to new. After this task, all old component files are unused.

**Files:** `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { GroupSelectorPage } from './pages/GroupSelectorPage';
import { GroupLayout } from './pages/GroupLayout';
import { ExpensesDashboard } from './pages/ExpensesDashboard';
import { GroupMembersPage } from './pages/GroupMembersPage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { InvitationLanding } from './public-pages/InvitationLanding';
import { GroupJoinLanding } from './public-pages/GroupJoinLanding';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const expiration = localStorage.getItem('tokenExpiration');
    if (token) {
      if (expiration && new Date(expiration) <= new Date()) {
        handleLogout(); return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    const id = axios.interceptors.response.use(
      r => r,
      err => { if (err.response?.status === 401) handleLogout(); return Promise.reject(err); },
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const handleLogin = (token: string) => {
    const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/groups" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/groups" replace /> : <LoginPage onLoginSuccess={handleLogin} />} />
      <Route path="/invite/:token" element={<InvitationLanding onLoginSuccess={handleLogin} />} />
      <Route path="/join/:token" element={<GroupJoinLanding onLoginSuccess={handleLogin} />} />

      {/* Protected */}
      {!isAuthenticated ? (
        <Route path="*" element={<Navigate to="/" replace />} />
      ) : (
        <Route element={<AppShell onLogout={handleLogout} />}>
          <Route path="/groups" element={<GroupSelectorPage />} />
          <Route path="/groups/:groupId" element={<GroupLayout />}>
            <Route index element={<ExpensesDashboard />} />
            <Route path="members" element={<GroupMembersPage />} />
            <Route path="settings" element={<GroupSettingsPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/groups" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
```

- [ ] **Step 2: Verify build and lint**

```bash
npm run build && npm run lint
```

Expected: build succeeds, no TypeScript or lint errors.

- [ ] **Step 3: Start dev server and do a visual smoke test**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- [ ] Landing page loads with dark hero
- [ ] "Get started" navigates to `/login`
- [ ] Login form works (email + password)
- [ ] Google mock button shows toast "coming soon"
- [ ] After login, sidebar is visible on desktop
- [ ] Groups list appears in sidebar
- [ ] Clicking a group shows tab bar (Expenses | Members | Settings)
- [ ] Month picker navigates months
- [ ] Balance panel shows balances
- [ ] Expense rows show badge chips
- [ ] Sort and filter controls work
- [ ] Add expense dialog opens with all fields
- [ ] Dark mode toggle switches theme and persists on reload
- [ ] On narrow window (< 1024px), sidebar is hidden and hamburger appears
- [ ] Hamburger opens Sheet sidebar

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx routing cutover to new redesign"
```

---

### Task 22: Remove MUI, delete old files, final cleanup

**Files:** `package.json`, all old component files

- [ ] **Step 1: Remove MUI packages**

```bash
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled
```

- [ ] **Step 2: Delete old component files**

```bash
rm src/components/Login.tsx
rm src/components/GroupSelector.tsx
rm src/components/GroupLayout.tsx
rm src/components/ExpensesDashboard.tsx
rm src/components/ExpenseContent.tsx
rm src/components/ExpenseHeader.tsx
rm src/components/ExpenseList.tsx
rm src/components/BalanceSummary.tsx
rm src/components/MonthPicker.tsx
rm src/components/FormModal.tsx
rm src/components/ConfirmationModal.tsx
rm src/components/Toast.tsx
rm src/components/LoadingSpinner.tsx
rm src/components/LoadingState.tsx
rm src/components/GroupMembers.tsx
rm src/components/GroupSettings.tsx
rm src/components/CreateGroupModal.tsx
rm src/components/Profile.tsx
rm src/components/InvitationLanding.tsx
rm src/components/GroupJoinLanding.tsx
rm src/components/ExpenseForm.tsx
rm src/components/MoneyTransferForm.tsx
```

- [ ] **Step 3: Verify clean build**

```bash
npm run build
```

Expected: build succeeds with zero errors. If any import still references a deleted file, fix it now.

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Fix any remaining ESLint warnings introduced by the new code.

- [ ] **Step 5: Final visual smoke test**

```bash
npm run dev
```

Repeat the smoke test checklist from Task 21 Step 3 to confirm nothing regressed after MUI removal.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove MUI, delete old components — redesign complete"
```

---

## Redesign complete ✓

All 22 tasks done. The app runs on Tailwind + shadcn/ui with:
- Dark/light mode toggle persisted in `localStorage`
- Left sidebar (desktop) + Sheet drawer (mobile)
- Inter font
- Landing page, new login with Google mock
- All original features preserved
