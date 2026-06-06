import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pen, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, capitalize, formatDate } from '@/utils/format';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from 'react-i18next';
import type { ExpenseResponse, Member } from '@/types/expense';
import { ExpenseDetailDialog } from './ExpenseDetailDialog';

const SPLIT_BADGE: Record<string, string> = {
  equal:      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  percentage: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  exact:      'bg-sky-100    text-sky-700    dark:bg-sky-900/40    dark:text-sky-300',
};

const PAYMENT_BADGE: Record<string, string> = {
  debit:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  credit: 'bg-blue-100    text-blue-700    dark:bg-blue-900/40    dark:text-blue-300',
};

// Internal categories are filtered from the API — hardcode their emojis here
const INTERNAL_EMOJI: Record<string, string> = {
  balance:  '⚖️',
  prestamo: '🤝',
};

interface ExpenseRowProps {
  expense: ExpenseResponse;
  members: Member[];
  isSettled: boolean;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  highlight?: boolean;
  hideSplitBadge?: boolean;
  hideActions?: boolean;
  groupId?: number;
  viewedYear?: number;
  viewedMonth?: number;
  onRecurringDelete?: (templateId: number) => void;
  onRecurringEdit?: (expense: ExpenseResponse) => void;
}

function memberName(members: Member[], id: number) {
  return members.find(m => m.id === id)?.name ?? 'Unknown';
}

export function ExpenseRow({ expense, members, isSettled, onEdit, onDelete, highlight = false, hideSplitBadge = false, hideActions = false, onRecurringDelete, onRecurringEdit }: ExpenseRowProps) {
  const canEdit = expense.installmentNo === 1;
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const categoryEmoji = categories.find(c => c.name === expense.category)?.emoji
    ?? INTERNAL_EMOJI[expense.category];
  const rowRef = useRef<HTMLDivElement>(null);
  const [isFlashing, setIsFlashing] = useState(highlight);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!highlight) return;
    rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setIsFlashing(false), 2000);
    return () => clearTimeout(timer);
  }, [highlight]);

  const splitLabel = (() => {
    if (expense.splitStrategy.type === 'equal' && expense.splitStrategy.participantIds?.length) {
      const names = expense.splitStrategy.participantIds
        .map(id => memberName(members, id))
        .join(', ');
      return `equal: ${names}`;
    }
    return expense.splitStrategy.type;
  })();

  return (
    <>
    <div
      ref={rowRef}
      onClick={() => setDetailOpen(true)}
      className={cn(
        'flex items-center gap-3 px-4 py-3 [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors group cursor-pointer touch-manipulation',
        isFlashing && 'bg-brand/10'
      )}
    >
      {/* Category icon — emoji from API, first 2 letters as fallback */}
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        {categoryEmoji
          ? <span className="text-lg leading-none">{categoryEmoji}</span>
          : <span className="text-xs font-bold text-muted-foreground uppercase">{expense.category.slice(0, 2)}</span>
        }
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground flex items-center gap-1 line-clamp-2">
          {capitalize(expense.description)}
          {expense.recurringTemplateId != null && (
            <Repeat className="h-3 w-3 text-brand flex-shrink-0" title={t('expenses.recurringBadgeTitle')} />
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {memberName(members, expense.payerId)} · {formatDate(expense.date, true)}
        </p>
        {expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {Object.entries(expense.splitStrategy.percentages)
              .map(([id, pct]) => {
                const pctNum = parseFloat(Number(pct).toFixed(1));
                const amt = formatCurrency((expense.amount * (pct ?? 0)) / 100);
                return `${memberName(members, parseInt(id))} ${pctNum}% (${amt})`;
              })
              .join(' · ')}
          </p>
        )}
        {expense.splitStrategy.type === 'exact' && expense.splitStrategy.amounts && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {Object.entries(expense.splitStrategy.amounts)
              .map(([id, amt]) => `${memberName(members, parseInt(id))} ${formatCurrency(amt ?? 0)}`)
              .join(' · ')}
          </p>
        )}
        {/* Mobile-only badges row */}
        <div className="flex sm:hidden items-center flex-wrap gap-1 mt-1">
          {!hideSplitBadge && (
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', SPLIT_BADGE[expense.splitStrategy.type])}>
              {splitLabel}
            </span>
          )}
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
            {expense.paymentType}
            {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {capitalize(t(`categories.${expense.category}`, { defaultValue: expense.category }))}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {!hideSplitBadge && (
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', SPLIT_BADGE[expense.splitStrategy.type])}>
            {splitLabel}
          </span>
        )}
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
          {expense.paymentType}
          {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {capitalize(t(`categories.${expense.category}`, { defaultValue: expense.category }))}
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
      {!isSettled && !hideActions && (
        <div
          className="flex items-center gap-1 opacity-0 invisible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:visible transition-opacity flex-shrink-0"
          onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            disabled={!canEdit}
            title={canEdit ? 'Edit' : 'Edit the first installment only'}
            onClick={() => {
              if (!canEdit) return;
              if (expense.recurringTemplateId != null && onRecurringEdit) {
                onRecurringEdit(expense);
              } else {
                onEdit(expense);
              }
            }}>
            <Pen className={cn('h-3.5 w-3.5', canEdit ? 'text-muted-foreground' : 'text-muted-foreground/30')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            disabled={!canEdit}
            title={canEdit ? 'Delete' : 'Delete the first installment only'}
            onClick={() => {
              if (!canEdit) return;
              if (expense.recurringTemplateId != null && onRecurringDelete) {
                onRecurringDelete(expense.recurringTemplateId);
              } else {
                onDelete(expense);
              }
            }}>
            <Trash2 className={cn('h-3.5 w-3.5', canEdit ? 'text-destructive' : 'text-muted-foreground/30')} />
          </Button>
        </div>
      )}
    </div>

    <ExpenseDetailDialog
      expense={expense}
      members={members}
      isSettled={isSettled}
      open={detailOpen}
      onOpenChange={setDetailOpen}
      onEdit={onEdit}
      onDelete={onDelete}
      hideSplitBadge={hideSplitBadge}
      hideActions={hideActions}
      onRecurringDelete={onRecurringDelete}
      onRecurringEdit={onRecurringEdit}
    />
    </>
  );
}
