import { useState, useCallback } from 'react';
import { checkSimilarExpenses, createExpense } from '@/api/expenses';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { ExpenseCreate, ExpenseResponse } from '@/types/expense';

interface UseGroupExpenseCreateOptions {
  groupId: number;
  onDone?: () => void;
}

interface UseGroupExpenseCreateResult {
  /** Submit an expense — runs dup-check first, may set duplicates instead of saving */
  create: (data: ExpenseCreate) => Promise<void>;
  /** Pending duplicates found — show confirm dialog when non-empty */
  duplicates: ExpenseResponse[];
  /** The pending expense waiting for dup-confirm */
  pendingExpense: ExpenseCreate | null;
  /** User confirmed — proceed with saving despite duplicates */
  confirm: () => Promise<void>;
  /** User cancelled dup-confirm */
  cancel: () => void;
}

export function useGroupExpenseCreate({
  groupId,
  onDone,
}: UseGroupExpenseCreateOptions): UseGroupExpenseCreateResult {
  const { t } = useTranslation();
  const [duplicates, setDuplicates] = useState<ExpenseResponse[]>([]);
  const [pendingExpense, setPendingExpense] = useState<ExpenseCreate | null>(null);

  const submit = useCallback(
    async (data: ExpenseCreate) => {
      const { data: result, error } = await createExpense(groupId, data);
      if (error || !result) throw new Error(error ?? 'Failed to create expense');
      setPendingExpense(null);
      setDuplicates([]);
      toast.success(t('toasts.expenseAdded'));
      onDone?.();
    },
    [groupId, t, onDone],
  );

  const create = useCallback(
    async (data: ExpenseCreate) => {
      const [y, m] = data.date.split('-').map(Number);
      const { data: similar } = await checkSimilarExpenses(
        groupId,
        y,
        m,
        data.amount,
        data.description,
        data.date,
      );
      if (similar && similar.length > 0) {
        setPendingExpense(data);
        setDuplicates(similar);
        return;
      }
      await submit(data);
    },
    [groupId, submit],
  );

  const confirm = useCallback(async () => {
    if (pendingExpense) {
      await submit(pendingExpense);
    }
  }, [pendingExpense, submit]);

  const cancel = useCallback(() => {
    setPendingExpense(null);
    setDuplicates([]);
  }, []);

  return { create, duplicates, pendingExpense, confirm, cancel };
}
