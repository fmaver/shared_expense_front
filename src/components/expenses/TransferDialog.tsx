import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { formatDate } from '@/utils/format';
import type { ExpenseCreate, Member } from '@/types/expense';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: ExpenseCreate) => Promise<void>;
  members: Member[];
  currentMemberId?: number | null;
}

export function TransferDialog({ open, onOpenChange, onSubmit, members, currentMemberId }: TransferDialogProps) {
  const { t } = useTranslation();
  const defaultPayer = (currentMemberId && members.some(m => m.id === currentMemberId))
    ? currentMemberId
    : (members[0]?.id ?? 0);
  const [payerId, setPayerId] = useState<number>(defaultPayer);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset payer to current user when dialog re-opens
  useEffect(() => {
    if (open) {
      setPayerId(defaultPayer);
      setAmount('');
      setDescription('');
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create a complete expense object with the transfer data
      const expense: ExpenseCreate = {
        description,
        amount: parseFloat(amount),
        date,
        category: { name: 'prestamo' },
        payerId,
        paymentType: 'debit',
        installments: 1,
        splitStrategy: {
          type: 'percentage',
          percentages: Object.fromEntries(
            members.map(m => [m.id, m.id === payerId ? 0 : 100 / (members.length - 1)])
          )
        }
      };

      await onSubmit(expense);
      setAmount('');
      setDescription('');
      onOpenChange(false);
    } catch {
      setError('Failed to create transfer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{t('transfer.title')}</DialogTitle></DialogHeader>
        <form id="transfer-form" onSubmit={handleSubmit} className="space-y-4 py-1">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="transfer-payer">{t('transfer.lender')}</Label>
            <Select value={String(payerId)} onValueChange={v => setPayerId(parseInt(v))}>
              <SelectTrigger id="transfer-payer">
                <span className="flex-1 text-left truncate">
                  {members.find(m => m.id === payerId)?.name ?? 'Select…'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-amount">{t('transfer.amount')}</Label>
            <Input id="transfer-amount" type="number" step="0.01" min="0" required
              placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-description">{t('transfer.description')}</Label>
            <Input id="transfer-description" type="text" maxLength={255} required
              placeholder="e.g. Dinner" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-date">{t('transfer.date')}</Label>
            <Input id="transfer-date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button form="transfer-form" type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={isLoading}>
            {isLoading ? t('transfer.saving') : t('transfer.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
