import React from 'react';
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
        {expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages && (
          <p className="text-xs text-muted-foreground truncate">
            {Object.entries(expense.splitStrategy.percentages)
              .map(([id, pct]) => `${memberName(members, parseInt(id))} ${parseFloat(Number(pct).toFixed(1))}%`)
              .join(' · ')}
          </p>
        )}
        {expense.splitStrategy.type === 'exact' && expense.splitStrategy.amounts && (
          <p className="text-xs text-muted-foreground truncate">
            {Object.entries(expense.splitStrategy.amounts)
              .map(([id, amt]) => `${memberName(members, parseInt(id))} ${formatCurrency(amt ?? 0)}`)
              .join(' · ')}
          </p>
        )}
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
