import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatAmountInput, sanitizeAmount } from '@/utils/format';

interface AmountInputProps {
  /** El monto crudo del estado: "12500" o "1250,5". Nunca un número. */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Color de la cifra: el ingreso va en verde. */
  tone?: 'default' | 'positive';
  className?: string;
}

/**
 * El número grande de las hojas de carga, como `<input>` real con el teclado del celular
 * (ADDENDUM-violeta.md, ajuste V5). Reemplaza al teclado propio.
 *
 * `type="text"` y no `number`: evita las flechitas, el scroll que cambia el valor y la coma
 * que según el teclado no está. `inputMode="decimal"` abre el teclado numérico con decimal.
 * No se enfoca solo: el teclado aparece recién cuando se toca el monto.
 *
 * El ancho sigue al contenido con el truco del grid: un span invisible con el mismo texto
 * define el ancho de la celda y el input la ocupa entera, así el `$` queda pegado a la cifra
 * y el conjunto centrado.
 */
export function AmountInput({ value, onChange, disabled = false, tone = 'default', className }: AmountInputProps) {
  const { t } = useTranslation();
  const display = formatAmountInput(value);
  const figure = 'text-[52px] font-bold leading-none tracking-[-0.035em] tabular-nums';

  return (
    <label className={cn('flex cursor-text items-center justify-center gap-1', className)}>
      <span className="text-[22px] font-semibold text-muted-2">$</span>
      <span className="inline-grid min-w-0 max-w-full">
        <span aria-hidden="true" className={cn(figure, 'invisible col-start-1 row-start-1 whitespace-pre px-0.5')}>
          {display || '0'}
        </span>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={t('expenseForm.amount')}
          placeholder="0"
          disabled={disabled}
          value={display}
          onChange={e => onChange(sanitizeAmount(e.target.value))}
          className={cn(
            figure,
            'col-start-1 row-start-1 w-full min-w-0 border-0 bg-transparent p-0 px-0.5 text-center outline-none',
            'caret-brand placeholder:text-muted-3 disabled:opacity-60',
            tone === 'positive' ? 'text-positive' : 'text-foreground',
          )}
        />
      </span>
    </label>
  );
}
