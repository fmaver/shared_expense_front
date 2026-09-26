import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * El contexto de un gasto, como filas de una tarjeta.
 *
 * Antes era una hilera de pastillas —"Hoy ▾", "Débito ▾"— y tenía dos problemas: no se sabía
 * qué era cada una hasta leer el valor, y con cuatro decisiones la hilera se iba de ancho y
 * scrolleaba. Una fila dice el nombre de la decisión a la izquierda y lo elegido a la derecha,
 * así que se lee de un vistazo y crece hacia abajo, donde hay lugar.
 */
export function ContextCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-line bg-surface', className)}>
      {children}
    </div>
  );
}

export function ContextRow({
  label, value, onClick, disabled = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-b-0',
        'transition-colors',
        disabled ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-surface-sunken',
      )}
    >
      <span className="shrink-0 text-[12.5px] font-medium text-muted-1">{label}</span>
      <span className="flex min-w-0 items-center gap-0.5 text-[13px] font-bold text-foreground">
        <span className="truncate">{value}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden="true" />
      </span>
    </button>
  );
}
