import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { capitalize } from '@/utils/format';
import type { IncomeInstanceResponse } from '@/types/expense';

interface IncomeDetailDialogProps {
  income: IncomeInstanceResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatAmount: (amount: number, currency?: string) => string;
  /** Persist an edit; returns true on success so the dialog can leave edit mode. */
  onSave: (income: IncomeInstanceResponse, label: string, amount: number, currency: 'ARS' | 'USD') => Promise<boolean>;
  onDelete: (income: IncomeInstanceResponse) => void;
}

/**
 * Tap-to-open detail sheet for a personal income, with edit + delete actions
 * that are always reachable (including on touch). Mirrors the expenses'
 * row → detail-dialog pattern.
 */
export function IncomeDetailDialog({
  income,
  open,
  onOpenChange,
  formatAmount,
  onSave,
  onDelete,
}: IncomeDetailDialogProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [saving, setSaving] = useState(false);

  // Reset to view mode with fresh values whenever a different income is opened.
  useEffect(() => {
    if (income) {
      setEditing(false);
      setLabel(income.label);
      setAmount(String(income.amount));
      setCurrency(income.currency === 'USD' ? 'USD' : 'ARS');
    }
  }, [income]);

  if (!income) return null;

  const isRecurring = income.source === 'recurring';

  const handleSave = async () => {
    if (!label || !amount) return;
    setSaving(true);
    const ok = await onSave(income, label, parseFloat(amount), currency);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base leading-tight">
            {editing ? t('common.edit') : capitalize(income.label)}
          </DialogTitle>
          <span
            className={`inline-flex w-fit text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 ${
              isRecurring
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            {isRecurring ? t('personal.recurringBadge') : t('personal.variableBadge')}
          </span>
        </DialogHeader>

        {editing ? (
          <div className="space-y-2">
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder={t('personal.income')} />
            <div className="flex items-center gap-2">
              <Input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
              <CurrencyToggle value={currency} onChange={setCurrency} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-brand hover:bg-brand/90 text-white"
                disabled={saving || !label || !amount}
                onClick={handleSave}
              >
                {saving ? '…' : t('common.save')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-lg px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{t('personal.income')}</span>
                <span className="text-xl font-bold text-green-600 tabular-nums">
                  {formatAmount(income.amount, income.currency)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />{t('common.edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(income)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />{t('common.delete')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
