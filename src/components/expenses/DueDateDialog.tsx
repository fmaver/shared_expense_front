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

/** `YYYY-MM-DD` parseado como fecha local: `new Date("2026-10-09")` la interpreta en UTC. */
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toInputValue(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
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

  const [label, setLabel] = useState('');
  // Se pide la próxima fecha concreta, no "el día del mes": es como la gente lee la boleta
  // ("vence el 9 de octubre"), le da el date picker nativo del sistema, y de ahí salen tanto
  // el día como el mes desde el que cuenta el ciclo.
  const [nextDue, setNextDue] = useState(() => toInputValue(new Date()));
  const [everyNMonths, setEveryNMonths] = useState(1);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setLabel('');
    setNextDue(toInputValue(new Date()));
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
      const due = parseLocalDate(nextDue);
      const created = await createDueDate(groupId, {
        label: label.trim(),
        dayOfMonth: due.getDate(),
        everyNMonths,
        // El ciclo cuenta desde el mes de esa primera fecha, así que "cada 2 meses" cae en
        // los meses que el usuario espera y no en los alternos.
        anchorYear: due.getFullYear(),
        anchorMonth: due.getMonth() + 1,
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

          <div className="space-y-1.5">
            <Label htmlFor="dueDateNext">{t('dueDates.nextDue')}</Label>
            <Input
              id="dueDateNext"
              type="date"
              className="text-left"
              value={nextDue}
              onChange={(e) => e.target.value && setNextDue(e.target.value)}
            />
            {parseLocalDate(nextDue).getDate() > 28 && (
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
                  {t(`dueDates.cadence${n}`)}
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
                  {n === 0 ? t('dueDates.sameDay') : t('dueDates.nDaysBefore', { count: n })}
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
