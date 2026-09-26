import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BudgetBarProps {
  totalIncome: number;
  /** Gastos propios del mes, en ARS. */
  totalExpenses: number;
  /** Lo que te toca de los gastos de los grupos, en ARS. */
  groupShare: number;
  formatAmt: (amount: number) => string;
  /** Gasto variable acumulado, para la proyección de ritmo. */
  variableExpensesSoFar?: number;
  year: number;
  month: number;
}

interface Segment {
  key: string;
  label: string;
  value: number;
  bar: string;
  dot: string;
}

/**
 * En qué se parte tu ingreso del mes.
 *
 * Tres segmentos proporcionales al ingreso — lo que gastaste, lo que te toca de los grupos y
 * lo que queda — separados por 2px para que se lean como tres cosas y no como un degradé.
 * Sin ingreso cargado no hay proporción posible, así que la barra no se dibuja.
 */
export function BudgetBar({
  totalIncome, totalExpenses, groupShare, formatAmt,
  variableExpensesSoFar = 0, year, month,
}: BudgetBarProps) {
  const { t } = useTranslation();

  if (totalIncome <= 0) return null;

  const left = Math.max(totalIncome - totalExpenses - groupShare, 0);
  const segments: Segment[] = [
    { key: 'own',    label: t('personal.legendOwnShort'),    value: totalExpenses, bar: 'bg-negative', dot: 'bg-negative' },
    { key: 'groups', label: t('personal.legendGroupsShort'), value: groupShare,    bar: 'bg-brand',    dot: 'bg-brand' },
    { key: 'left',   label: t('personal.legendLeftShort'),   value: left,          bar: 'bg-positive', dot: 'bg-positive' },
  ].filter(s => s.value > 0);

  // Los porcentajes se calculan sobre el total de los segmentos y no sobre el ingreso: si te
  // pasaste, la barra se llena igual en vez de dejar un hueco que no dice nada.
  const denominator = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  /* Proyección de ritmo: cuánto terminarías gastando si seguís así hasta fin de mes. Sólo el
     gasto variable se extrapola —lo fijo ya cayó entero— y sólo tiene sentido en el mes
     en curso, cuando todavía quedan días por delante. */
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const projectedVariable = isCurrentMonth && dayOfMonth > 2
    ? (variableExpensesSoFar / dayOfMonth) * daysInMonth
    : 0;
  const projectedTotal = projectedVariable > 0
    ? totalExpenses - variableExpensesSoFar + projectedVariable + groupShare
    : 0;
  const willOverspend = projectedTotal > totalIncome * 1.02;

  return (
    <div>
      <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
        {segments.map(seg => (
          <div
            key={seg.key}
            className={cn('h-full rounded-full', seg.bar)}
            style={{ width: `${(seg.value / denominator) * 100}%` }}
          />
        ))}
      </div>

      {/*
        La leyenda dice porcentaje, no monto: la barra ya es una proporción, y el monto exacto
        de cada parte lo dice su sección más abajo. Repetirlo acá era decirlo dos veces.
      */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {segments.map(seg => (
          <span
            key={seg.key}
            className="inline-flex items-center gap-1.5 rounded-pill bg-surface-sunken px-2.5 py-1"
          >
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', seg.dot)} aria-hidden="true" />
            <span className="text-[11.5px] font-medium text-muted-1">{seg.label}</span>
            <span className="text-[11.5px] font-bold tabular-nums text-foreground">
              {Math.round((seg.value / denominator) * 100)}%
            </span>
          </span>
        ))}
      </div>

      {willOverspend && (
        <p className="mt-2 text-[11px] font-medium leading-[1.45] text-muted-2">
          {t('personal.paceOverspend', { amount: formatAmt(projectedTotal - totalIncome) })}
        </p>
      )}
    </div>
  );
}
