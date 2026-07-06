import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createRecurringIncome, createVariableIncome } from '@/api/personal';
import type { IncomeInstanceResponse } from '@/types/expense';

type IncomeType = 'recurring' | 'variable';

interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Skip the type picker and go straight to the form. */
  presetType?: IncomeType;
  year: number;
  month: number;
  /** Current month's incomes, used for duplicate detection. */
  existingIncomes: IncomeInstanceResponse[];
  onSaved: () => void;
}

/** Popup form for adding a one-off or recurring income to the personal group. */
export function AddIncomeDialog({ open, onOpenChange, presetType, year, month, existingIncomes, onSaved }: AddIncomeDialogProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<IncomeType | null>(presetType ?? null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [saving, setSaving] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

  // Reset to a fresh form each time the dialog opens; clear a pending
  // duplicate-confirm on close so it can't linger over a closed dialog
  useEffect(() => {
    if (open) {
      setType(presetType ?? null);
      setLabel('');
      setAmount('');
      setCurrency('ARS');
    }
    setConfirmDuplicate(false);
  }, [open, presetType]);

  const doSave = async () => {
    if (!label || !amount || !type) return;
    setSaving(true);
    try {
      if (type === 'recurring') {
        await createRecurringIncome({ label, amount: parseFloat(amount), startYear: year, startMonth: month, currency });
      } else {
        await createVariableIncome({ year, month, label, amount: parseFloat(amount), currency });
      }
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
    if (!label || !amount || !type) return;
    const amt = parseFloat(amount);
    const isDuplicate = existingIncomes.some(
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
            <DialogTitle>
              {type === 'recurring' ? t('personal.recurringTitle')
                : type === 'variable' ? t('personal.variableTitle')
                : t('personal.addIncome')}
            </DialogTitle>
          </DialogHeader>

          {type === null ? (
            /* Type picker — same cards as the old inline flow */
            <div className="space-y-1.5">
              <button type="button" onClick={() => setType('recurring')}
                className="w-full text-left px-3 py-2.5 rounded-md border border-border bg-background hover:border-brand/50 hover:bg-accent/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-foreground">{t('personal.recurringTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('personal.recurringDesc')}</p>
              </button>
              <button type="button" onClick={() => setType('variable')}
                className="w-full text-left px-3 py-2.5 rounded-md border border-border bg-background hover:border-brand/50 hover:bg-accent/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-foreground">{t('personal.variableTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('personal.variableDesc')}</p>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {type === 'recurring' ? t('personal.recurringDesc') : t('personal.variableDesc')}
              </p>
              <Input
                placeholder={t('personal.salaryLabel')} value={label} onChange={e => setLabel(e.target.value)} />
              <div className="flex gap-2 items-center">
                <Input
                  className="flex-1"
                  type="number" placeholder={t('personal.salaryAmount')} value={amount} onChange={e => setAmount(e.target.value)} />
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                {!presetType && (
                  <Button variant="ghost" size="sm" onClick={() => setType(null)}>
                    ← {t('common.back')}
                  </Button>
                )}
                <Button size="sm" disabled={saving || !label || !amount} onClick={handleSave}
                  className="bg-brand hover:bg-brand/90 text-white">
                  {saving ? t('common.loading') : t('personal.saveSalary')}
                </Button>
              </div>
            </div>
          )}
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
