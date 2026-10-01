import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * El "¿Qué fue?" del alta de gasto (grupo y personal).
 *
 * Antes era texto suelto, sin borde ni fondo y con el placeholder en muted-3: en las pruebas
 * con usuarios pasaba desapercibido y recién se descubría al tocar "Agregar" y ver el error.
 * Ahora tiene forma de campo (fondo, borde y lápiz), 16px para que iOS no haga zoom al
 * enfocarlo, y `invalid` lo pinta de rojo cuando el guardado falla por estar vacío.
 */
export const DescriptionInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fromPhoto?: boolean;
  invalid?: boolean;
}>(function DescriptionInput({ value, onChange, disabled, fromPhoto, invalid }, ref) {
  const { t } = useTranslation();
  return (
    <>
    <label
      className={cn(
        'mt-4 flex w-full cursor-text items-center gap-2 rounded-[14px] border-[1.5px] bg-surface-sunken px-3.5 py-2.5 transition-colors',
        // El rojo le gana al foco: el error enfoca el campo, y con el violeta no se vería.
        invalid ? 'border-negative' : cn('focus-within:border-brand-soft', fromPhoto ? 'border-brand-soft' : 'border-line-strong'),
      )}
    >
      <Pencil className={cn('h-4 w-4 shrink-0', invalid ? 'text-negative' : 'text-muted-2')} aria-hidden="true" />
      <input
        ref={ref}
        type="text"
        value={value}
        maxLength={255}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={t('expenseForm.whatWasIt')}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? 'description-error' : undefined}
        className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-2"
      />
    </label>
    {invalid && (
      <p id="description-error" role="alert" className="mt-1.5 px-1 text-[12px] font-semibold text-negative">
        {t('expenseForm.descriptionRequired')}
      </p>
    )}
    </>
  );
});
