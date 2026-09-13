import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface FieldBoxProps extends Omit<React.ComponentProps<'input'>, 'className'> {
  label: string;
  /** Aclaración al lado del label, en minúscula: "opcional · para avisos por WhatsApp". */
  hint?: string;
  /** Acción a la derecha, como el "Ver" de una contraseña. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Campo con el label adentro de la caja.
 *
 * El label vive arriba del valor, dentro del mismo recuadro: ocupa el lugar que de otro modo
 * sería aire y deja el formulario más corto sin perder el rótulo, que es lo que pasa con los
 * placeholders. El foco se marca con borde tinta de 2px y no con el anillo de marca — así lo
 * fija el diseño del ingreso.
 */
export function FieldBox({ label, hint, action, className, id, ...props }: FieldBoxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      className={cn(
        'group relative rounded-[12px] border border-line-strong bg-surface px-3.5 py-2.5',
        'transition-colors focus-within:border-[2px] focus-within:border-ink focus-within:px-[13px] focus-within:py-[9px]',
        'dark:focus-within:border-paper',
        className,
      )}
    >
      <div className="flex items-baseline gap-2">
        <label
          htmlFor={inputId}
          className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2"
        >
          {label}
        </label>
        {hint && <span className="truncate text-[10.5px] font-medium text-muted-3">{hint}</span>}
      </div>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          className="mt-0.5 w-full min-w-0 border-0 bg-transparent p-0 text-[16px] font-medium text-foreground outline-none placeholder:text-muted-3"
          {...props}
        />
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
