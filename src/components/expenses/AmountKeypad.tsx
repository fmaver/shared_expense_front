import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Cuántos decimales admite el monto. Dos, como la moneda. */
const MAX_DECIMALS = 2;

interface AmountKeypadProps {
  /** El monto tal como se está tipeando: "12500" o "1250,5". Nunca un número. */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Teclado numérico propio, 3×4.
 *
 * `input type="number"` en el celular abre el teclado del sistema, que trae letras, símbolos
 * y una coma que según el teclado no está — y encima empuja toda la hoja hacia arriba. Acá el
 * monto es lo único que se tipea, así que el teclado es parte de la pantalla y no algo que
 * aparece encima. Mismo criterio que ya venía en `DueDateDialog` con las opciones numéricas.
 *
 * El valor viaja como string a propósito: "1250," es un estado intermedio válido mientras
 * tipeás, y un número no puede representarlo.
 */
export function AmountKeypad({ value, onChange, disabled = false, className }: AmountKeypadProps) {
  const press = (key: string) => {
    if (disabled) return;

    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === ',') {
      if (value.includes(',')) return;
      onChange(value === '' ? '0,' : `${value},`);
      return;
    }

    const [whole, decimals] = value.split(',');
    if (decimals !== undefined && decimals.length >= MAX_DECIMALS) return;
    // Un cero solo al principio no acumula: "0" y después "5" es 5, no 05.
    if (value === '0') { onChange(key); return; }
    if (whole.replace(/\D/g, '').length >= 12 && decimals === undefined) return;

    onChange(value + key);
  };

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'];

  return (
    <div className={cn('grid grid-cols-3 gap-1.5', className)}>
      {KEYS.map(key => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onClick={() => press(key)}
          aria-label={key === 'del' ? 'Borrar' : key}
          className={cn(
            'flex h-12 items-center justify-center rounded-[14px] text-[20px] font-bold tabular-nums',
            // Con borde y fondo de tarjeta: planas se leían como texto suelto y no como teclas.
            'border border-line bg-surface transition-colors select-none',
            disabled
              ? 'cursor-default text-muted-3'
              : 'cursor-pointer text-foreground hover:bg-surface-sunken active:bg-line',
          )}
        >
          {key === 'del' ? <Delete className="h-5 w-5" aria-hidden="true" /> : key}
        </button>
      ))}
    </div>
  );
}
