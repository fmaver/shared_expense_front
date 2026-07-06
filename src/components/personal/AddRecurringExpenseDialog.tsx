import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createRecurringPersonalExpense } from '@/api/personal';
import type { RecurringPersonalExpenseInstanceResponse, CategoryWithEmoji } from '@/types/expense';

interface AddRecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  /** Current month's recurring expenses, used for duplicate detection. */
  existingRecurring: RecurringPersonalExpenseInstanceResponse[];
  onSaved: () => void;
}

/** Popup form for adding a recurring monthly expense to the personal group. */
export function AddRecurringExpenseDialog({ open, onOpenChange, year, month, categories, existingRecurring, onSaved }: AddRecurringExpenseDialogProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [saving, setSaving] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

  // Reset to a fresh form each time the dialog opens; clear a pending
  // duplicate-confirm on close so it can't linger over a closed dialog
  useEffect(() => {
    if (open) {
      setLabel('');
      setAmount('');
      setCategory('');
      setCurrency('ARS');
    }
    setConfirmDuplicate(false);
  }, [open]);

  // Default the category when the catalog is available — without wiping a
  // selection (or the rest of the form) if categories load mid-dialog
  useEffect(() => {
    if (open && categories.length > 0) {
      setCategory(c => c || categories[0].name);
    }
  }, [open, categories]);

  const doSave = async () => {
    if (!label || !amount || !category) return;
    setSaving(true);
    try {
      await createRecurringPersonalExpense({
        label,
        amount: parseFloat(amount),
        categoryName: category,
        startYear: year,
        startMonth: month,
        currency,
      });
      toast.success(t('toasts.expenseAdded'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!label || !amount || !category) return;
    const amt = parseFloat(amount);
    const isDuplicate = existingRecurring.some(
      i => Math.abs(i.amount - amt) < 0.01 && i.label.trim().toLowerCase() === label.trim().toLowerCase()
    );
    if (isDuplicate) {
      setConfirmDuplicate(true);
      return;
    }
    await doSave();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('personal.recurringExpense')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t('personal.recurringExpenseTitle')}</p>
            <Input placeholder={t('expenseForm.description')} value={label} onChange={e => setLabel(e.target.value)} />
            <div className="flex gap-2 items-center">
              <Input type="number" placeholder={t('expenseForm.amount')} value={amount} onChange={e => setAmount(e.target.value)} className="flex-1" />
              <CurrencyToggle value={currency} onChange={setCurrency} />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <span className="flex-1 text-left text-sm">
                  {categories.find(c => c.name === category)
                    ? `${categories.find(c => c.name === category)!.emoji} ${category}`
                    : category}
                </span>
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" disabled={saving || !label || !amount || !category} onClick={handleSave}
                className="bg-brand hover:bg-brand/90 text-white">
                {saving ? t('common.loading') : t('personal.saveSalary')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDuplicate && (
        <ConfirmDialog
          open={confirmDuplicate}
          onOpenChange={open => { if (!open) setConfirmDuplicate(false); }}
          title={t('expenses.duplicateTitle')}
          description={t('expenses.duplicateDesc') + ' ' + t('expenses.addAnywayQuestion')}
          confirmLabel={t('expenses.addAnyway')}
          destructive={false}
          onConfirm={async () => { setConfirmDuplicate(false); await doSave(); }}
        />
      )}
    </>
  );
}
