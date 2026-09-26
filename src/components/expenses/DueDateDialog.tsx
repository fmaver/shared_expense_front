import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { createDueDate } from '@/api/dueDates';
import type { DueDate } from '@/types/expense';

interface DueDateDialogProps {
  groupId: number;
  /** Nombre del grupo, para la confirmación en palabras. Sin él, el copy habla en singular. */
  groupName?: string;
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

function chip(active: boolean) {
  return cn(
    'h-9 min-w-9 cursor-pointer rounded-pill px-3 text-[12.5px] font-bold transition-colors',
    active
      ? 'bg-brand text-white'
      : 'border border-line-strong text-muted-1 hover:bg-surface-sunken',
  );
}

/**
 * Un campo con su label adentro de la caja: afuera se lee como texto suelto entre campo y campo.
 *
 * Vive fuera del componente a propósito. Definido adentro, React lo trata como un tipo nuevo en
 * cada render y remonta el `<input>` que envuelve — el foco se pierde en cada tecla.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface px-3.5 py-3">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">{label}</p>
      {children}
    </div>
  );
}

/**
 * Alta de un vencimiento.
 *
 * Las tres opciones numéricas se eligen con botones y no con inputs de número: en el celular
 * un `type="number"` abre el teclado y obliga a apuntar a una flechita de 2mm, y los valores
 * útiles son media docena. Es más rápido tocar "cada 2 meses" que tipearlo.
 */
export function DueDateDialog({ groupId, groupName, open, onOpenChange, onCreated }: DueDateDialogProps) {
  const { t, i18n } = useTranslation();

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

  /** El día en que sale el aviso: el vencimiento menos los días de anticipación. */
  const noticeDate = (() => {
    const due = parseLocalDate(nextDue);
    const notice = new Date(due);
    notice.setDate(due.getDate() - notifyDaysBefore);
    return notice.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-AR', {
      day: 'numeric',
      month: 'long',
    });
  })();

  /** "jueves 9 de octubre" — la fecha elegida, leída como se lee una boleta. */
  const dueInWords = parseLocalDate(nextDue).toLocaleDateString(
    i18n.language === 'en' ? 'en-US' : 'es-AR',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 rounded-t-sheet" showCloseButton={false}>
        <div className="max-h-[calc(88dvh-2rem)] overflow-y-auto px-5 pb-5 pt-2">
          <DialogTitle className="font-display text-[24px] leading-[1.25] text-foreground">
            {t('dueDates.addTitle')}
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
            <Field label={t('dueDates.whatDue')}>
              <input
                id="dueDateLabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('dueDates.labelPlaceholder')}
                maxLength={255}
                autoFocus
                className="mt-1 w-full border-0 bg-transparent p-0 text-[15px] font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-3"
              />
            </Field>

            <Field label={t('dueDates.nextDate')}>
              {/* La fecha en palabras primero: el input nativo dice 09/10/2026, que hay que
                  descifrar. "Jueves 9 de octubre" se entiende sin traducir nada. */}
              {/* `capitalize` de Tailwind sube la inicial de cada palabra y deja "14 De Septiembre".
                  Sólo la primera letra: es una oración, no un título. */}
              <p className="mt-1 text-[15px] font-semibold text-foreground first-letter:uppercase">
                {dueInWords}
              </p>
              <input
                id="dueDateNext"
                type="date"
                value={nextDue}
                onChange={(e) => e.target.value && setNextDue(e.target.value)}
                className="mt-1.5 w-full border-0 bg-transparent p-0 text-[12.5px] font-medium text-muted-1 outline-none"
              />
              {parseLocalDate(nextDue).getDate() > 28 && (
                <p className="mt-1 text-[11.5px] font-medium text-muted-2">{t('dueDates.shortMonthNote')}</p>
              )}
            </Field>

            <Field label={t('dueDates.howOften')}>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CADENCES.map((n) => (
                  <button key={n} type="button" onClick={() => setEveryNMonths(n)} className={chip(n === everyNMonths)}>
                    {t(`dueDates.cadence${n}`)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t('dueDates.notifyMe')}>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ADVANCES.map((n) => (
                  <button key={n} type="button" onClick={() => setNotifyDaysBefore(n)} className={chip(n === notifyDaysBefore)}>
                    {n === 0 ? t('dueDates.sameDay') : t('dueDates.nDaysBefore', { count: n })}
                  </button>
                ))}
              </div>
            </Field>

            {/*
              Lo que se acaba de configurar, dicho en palabras. Las opciones de arriba son
              parámetros; esta línea es la consecuencia, que es lo que la persona confirma.
            */}
            <p className="rounded-card border border-brand-wash-line bg-brand-wash px-3.5 py-3 text-[11.5px] font-medium leading-[1.5] text-brand-ink">
              {t(groupName ? 'dueDates.confirmationGroup' : 'dueDates.confirmationSolo', {
                group: groupName,
                date: noticeDate,
                cadence: t(`dueDates.cadenceEvery${everyNMonths}`),
              })}
            </p>

            {error && (
              <p className="rounded-[12px] border border-negative-wash-line bg-negative-wash px-3 py-2 text-[12px] font-semibold text-negative-ink">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !label.trim()}
              className="h-12 w-full cursor-pointer rounded-[14px] bg-brand text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('dueDates.saveLong')}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
