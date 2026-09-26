import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

/** Cuotas que ofrece una tarjeta acá: las que se ven en la calle. */
const INSTALLMENT_OPTIONS = [2, 3, 6, 9, 12, 18, 24];

/**
 * El panel que tapa la hoja mientras elegís una cosa.
 *
 * Es una capa dentro de la misma hoja y no un diálogo nuevo: apilar hojas en mobile deja al
 * usuario sin saber cuántos "atrás" le faltan para volver a lo que estaba haciendo.
 */
export function PickerOverlay({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-popover">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.back')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-1 hover:bg-surface-sunken"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[13px] font-bold text-foreground">{title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5">{children}</div>

      <div className="border-t border-line p-4">
        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full cursor-pointer rounded-[12px] bg-ink text-[13px] font-bold text-paper dark:bg-paper dark:text-ink"
        >
          {t('expenseForm.done')}
        </button>
      </div>
    </div>
  );
}

/** Qué día fue. */
export function DatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  return (
    <Input type="date" value={value} onChange={e => onChange(e.target.value)} className="text-base" />
  );
}

/** Débito, o crédito en N cuotas. */
export function PaymentPicker({
  paymentType, installments, onChange,
}: {
  paymentType: 'debit' | 'credit';
  installments: number;
  onChange: (next: { paymentType: 'debit' | 'credit'; installments: number }) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(['debit', 'credit'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({
              paymentType: type,
              installments: type === 'debit' ? 1 : Math.max(installments, 2),
            })}
            className={cn(
              'h-9 flex-1 cursor-pointer rounded-pill text-[12.5px] font-bold transition-colors',
              paymentType === type
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                : 'border border-line-strong text-muted-1',
            )}
          >
            {t(type === 'debit' ? 'expenseForm.debit' : 'expenseForm.credit')}
          </button>
        ))}
      </div>
      {paymentType === 'credit' && (
        <div className="flex flex-wrap gap-1.5">
          {INSTALLMENT_OPTIONS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ paymentType: 'credit', installments: n })}
              className={cn(
                'h-9 w-11 cursor-pointer rounded-pill text-[12.5px] font-bold tabular-nums transition-colors',
                installments === n ? 'bg-brand text-white' : 'border border-line-strong text-muted-1',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Desde qué mes empieza a aparecer solo. */
export function StartMonthPicker({
  year, month, onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const { t } = useTranslation();
  const months = t('months', { returnObjects: true }) as string[];
  const years = [year - 1, year, year + 1];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {years.map(y => (
          <button
            key={y}
            type="button"
            onClick={() => onChange(y, month)}
            className={cn(
              'h-9 flex-1 cursor-pointer rounded-pill text-[12.5px] font-bold tabular-nums transition-colors',
              y === year ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'border border-line-strong text-muted-1',
            )}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {months.map((name, index) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(year, index + 1)}
            className={cn(
              'h-9 cursor-pointer rounded-pill text-[12px] font-bold transition-colors',
              index + 1 === month ? 'bg-brand text-white' : 'border border-line-strong text-muted-1',
            )}
          >
            {name.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}
