import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createDueDate } from '@/api/dueDates';
import type { DueDate } from '@/types/expense';

interface DueDateDialogProps {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (dueDate: DueDate) => void;
}

const CADENCES = [1, 2, 3, 6, 12];
const ADVANCES = [0, 1, 3, 5, 7];

/**
 * Alta de un vencimiento.
 *
 * Las tres opciones numéricas se eligen con botones y no con inputs de número: en el celular
 * un `type="number"` abre el teclado y obliga a apuntar a una flechita de 2mm, y los valores
 * útiles son media docena. Es más rápido tocar "cada 2 meses" que tipearlo.
 */
export function DueDateDialog({ groupId, open, onOpenChange, onCreated }: DueDateDialogProps) {
  const { t } = useTranslation();
  const today = new Date();

  const [label, setLabel] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(today.getDate());
  const [everyNMonths, setEveryNMonths] = useState(1);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setLabel('');
    setDayOfMonth(new Date().getDate());
    setEveryNMonths(1);
    setNotifyDaysBefore(3);
    setError('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const created = await createDueDate(groupId, {
        label: label.trim(),
        dayOfMonth,
        everyNMonths,
        // El ciclo cuenta desde el mes en curso: "cada 2 meses" cargado hoy significa este
        // mes y no uno arbitrario del pasado.
        anchorYear: today.getFullYear(),
        anchorMonth: today.getMonth() + 1,
        notifyDaysBefore,
      });
      reset();
      onCreated(created);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const chip = (active: boolean) =>
    `h-9 min-w-9 px-3 rounded-full text-sm cursor-pointer transition-colors ${
      active
        ? 'bg-brand text-white'
        : 'bg-muted text-muted-foreground hover:bg-muted/70'
    }`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dueDates.add')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="dueDateLabel">{t('dueDates.label')}</Label>
            <Input
              id="dueDateLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('dueDates.labelPlaceholder')}
              maxLength={255}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{t('dueDates.dayOfMonth')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayOfMonth(day)}
                  className={chip(day === dayOfMonth)}
                >
                  {day}
                </button>
              ))}
            </div>
            {dayOfMonth > 28 && (
              <p className="text-xs text-muted-foreground">{t('dueDates.shortMonthNote')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('dueDates.everyNMonths')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {CADENCES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEveryNMonths(n)}
                  className={chip(n === everyNMonths)}
                >
                  {n === 1 ? t('dueDates.monthly') : t('dueDates.everyN', { n })}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('dueDates.notifyDaysBefore')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {ADVANCES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNotifyDaysBefore(n)}
                  className={chip(n === notifyDaysBefore)}
                >
                  {n === 0 ? t('dueDates.sameDay') : t('dueDates.nDaysBefore', { n })}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isLoading || !label.trim()} className="w-full">
              {t('dueDates.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
