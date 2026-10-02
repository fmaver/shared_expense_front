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
  label, value, onClick, disabled = false, badge,
}: {
  label: string;
  value: string;
  onClick: () => void;
  disabled?: boolean;
  /** Algo chico antes del valor, como la pastilla "de la foto". */
  badge?: React.ReactNode;
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
      <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-foreground">
        {badge}
        <span className="truncate">{value}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden="true" />
      </span>
    </button>
  );
}

/**
 * La fila "Cuándo", que abre el calendario del sistema de un toque.
 *
 * Antes la fila abría una hoja con un `<input type="date">` adentro, y había que tocar ese input
 * para ver el calendario: dos toques para elegir un día. Ahora el input nativo está encima de la
 * fila, invisible: en iPhone y Android el toque cae en él y abre el calendario directo. En la
 * compu, donde el input sólo responde en su iconito, `showPicker()` lo abre desde cualquier punto.
 */
export function ContextDateRow({
  label, value, date, onChange, disabled = false, badge,
}: {
  label: string;
  /** Lo que se lee a la derecha ("Hoy · 2 oct"). */
  value: string;
  /** "YYYY-MM-DD". */
  date: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'relative flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-b-0',
        'transition-colors',
        disabled ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-surface-sunken',
      )}
    >
      <span className="shrink-0 text-[12.5px] font-medium text-muted-1">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-foreground">
        {badge}
        <span className="truncate">{value}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden="true" />
      </span>
      <input
        type="date"
        value={date}
        disabled={disabled}
        aria-label={label}
        onChange={e => { if (e.target.value) onChange(e.target.value); }}
        onClick={e => {
          try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* ya abierto */ }
        }}
        // 16px: con menos, iOS hace zoom al enfocarlo.
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 text-[16px]"
      />
    </label>
  );
}
