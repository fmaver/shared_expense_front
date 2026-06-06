import React from 'react';
import { Pen, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, capitalize, formatDate } from '@/utils/format';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

const INTERNAL_EMOJI: Record<string, string> = {
  balance:  '⚖️',
  prestamo: '🤝',
};

interface ExpenseDetailDialogProps {
  expense: ExpenseResponse;
  members: Member[];
  isSettled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  hideSplitBadge?: boolean;
  hideActions?: boolean;
  onRecurringDelete?: (templateId: number) => void;
  onRecurringEdit?: (expense: ExpenseResponse) => void;
}

function memberName(members: Member[], id: number) {
  return members.find(m => m.id === id)?.name ?? 'Unknown';
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground flex-1">{children}</span>
    </div>
  );
}

export function ExpenseDetailDialog({
  expense,
  members,
  isSettled,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  hideSplitBadge = false,
  hideActions = false,
  onRecurringDelete,
  onRecurringEdit,
}: ExpenseDetailDialogProps) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const categoryEmoji = categories.find(c => c.name === expense.category)?.emoji
    ?? INTERNAL_EMOJI[expense.category];
  const canEdit = expense.installmentNo === 1;

  const splitLabel = (() => {
    if (expense.splitStrategy.type === 'equal' && expense.splitStrategy.participantIds?.length) {
      return expense.splitStrategy.participantIds.map(id => memberName(members, id)).join(', ');
    }
    return null;
  })();

  const handleEdit = () => {
    onOpenChange(false);
    if (expense.recurringTemplateId != null && onRecurringEdit) {
      onRecurringEdit(expense);
    } else {
      onEdit(expense);
    }
  };

  const handleDelete = () => {
    onOpenChange(false);
    if (expense.recurringTemplateId != null && onRecurringDelete) {
      onRecurringDelete(expense.recurringTemplateId);
    } else {
      onDelete(expense);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* Emoji + title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              {categoryEmoji
                ? <span className="text-2xl leading-none">{categoryEmoji}</span>
                : <span className="text-sm font-bold text-muted-foreground uppercase">{expense.category.slice(0, 2)}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base leading-tight">
                {capitalize(expense.description)}
                {expense.recurringTemplateId != null && (
                  <Repeat className="inline h-3.5 w-3.5 text-brand ml-1.5 align-middle" title={t('expenses.recurringBadgeTitle')} />
                )}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {capitalize(t(`categories.${expense.category}`, { defaultValue: expense.category }))}
                {' · '}{formatDate(expense.date, true)}
              </p>
            </div>
          </div>

          {/* Amount — prominent */}
          <div className="bg-muted/50 rounded-lg px-4 py-3 mt-1 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">{t('expenses.amount', { defaultValue: 'Amount' })}</span>
            <div className="text-right">
              <span className="text-xl font-bold text-foreground tabular-nums">
                {formatCurrency(expense.amount)}
              </span>
              {expense.paymentType === 'credit' && expense.installments > 1 && (
                <p className="text-[11px] text-muted-foreground">
                  {t('expenses.installmentOf', { defaultValue: 'instalment {{no}}/{{total}} of {{total_amount}}', no: expense.installmentNo, total: expense.installments, total_amount: formatCurrency(expense.amount * expense.installments) })}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Detail rows */}
        <div className="px-1">
          <DetailRow label={t('expenses.payer', { defaultValue: 'Payer' })}>
            {memberName(members, expense.payerId)}
          </DetailRow>

          <DetailRow label={t('expenses.payment', { defaultValue: 'Payment' })}>
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
              {expense.paymentType}
              {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
            </span>
          </DetailRow>

          {!hideSplitBadge && (
            <DetailRow label={t('expenses.split', { defaultValue: 'Split' })}>
              <div className="flex flex-col gap-1">
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full self-start', SPLIT_BADGE[expense.splitStrategy.type])}>
                  {expense.splitStrategy.type}
                  {splitLabel && `: ${splitLabel}`}
                </span>
                {expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {Object.entries(expense.splitStrategy.percentages).map(([id, pct]) => {
                      const pctNum = parseFloat(Number(pct).toFixed(1));
                      const amt = formatCurrency((expense.amount * (pct ?? 0)) / 100);
                      return (
                        <span key={id} className="text-xs text-muted-foreground">
                          {memberName(members, parseInt(id))}: {pctNum}% ({amt})
                        </span>
                      );
                    })}
                  </div>
                )}
                {expense.splitStrategy.type === 'exact' && expense.splitStrategy.amounts && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {Object.entries(expense.splitStrategy.amounts).map(([id, amt]) => (
                      <span key={id} className="text-xs text-muted-foreground">
                        {memberName(members, parseInt(id))}: {formatCurrency(amt ?? 0)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </DetailRow>
          )}
        </div>

        {/* Footer actions */}
        {!isSettled && !hideActions && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canEdit}
              title={canEdit ? undefined : 'Edit the first installment only'}
              onClick={handleEdit}
            >
              <Pen className="h-3.5 w-3.5 mr-1.5" />
              {t('common.edit', { defaultValue: 'Edit' })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canEdit}
              title={canEdit ? undefined : 'Delete the first installment only'}
              className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t('common.delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
