import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import type { ExpenseResponse, Member } from '@/types/expense';

type SortField = 'date' | 'description' | 'amount' | 'category' | 'payer' | 'paymentType' | 'splitStrategy';
type SortOrder = 'asc' | 'desc';

/**
 * Los tres chips de alcance dentro del mes.
 *
 * "Todo el mes" reemplaza al viejo "Todos", que se leía como "todos los gastos de la historia":
 * el mes ya es el alcance, y el chip sólo filtra adentro (principio 3).
 */
type Scope = 'all' | 'unsettled' | 'mine';

/** Las categorías internas son plata que ya se movió, no gasto pendiente. */
const INTERNAL_CATEGORIES = new Set(['balance', 'prestamo']);

interface ExpenseListHeaderProps {
  expenses: ExpenseResponse[];
  members: Member[];
  /** El segundo argumento dice si el orden actual permite agrupar por día. */
  onSorted: (sorted: ExpenseResponse[], groupByDate: boolean) => void;
  /** Nombre del mes en curso, para el conteo en palabras. */
  monthLabel: string;
  /** Un grupo de evento no tiene meses: el conteo lo dice de otra manera. */
  isOneTime?: boolean;
  onExportPdf?: () => void;
  /** Un mes cerrado se lee, no se edita: la lista lo dice sin que haya que deducirlo. */
  isSettled?: boolean;
}

export function ExpenseListHeader({
  expenses, members, onSorted, monthLabel, isOneTime = false, onExportPdf, isSettled = false,
}: ExpenseListHeaderProps) {
  const { t } = useTranslation();
  const { displayMode, setDisplayMode, blueRate } = useCurrency();
  const currentMember = useCurrentMember();

  const [scope, setScope] = useState<Scope>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortOpen, setSortOpen] = useState(false);

  const SORT_FIELDS: { value: SortField; label: string }[] = [
    { value: 'date',          label: t('expenses.sortFields.date') },
    { value: 'amount',        label: t('expenses.sortFields.amount') },
    { value: 'description',   label: t('expenses.sortFields.description') },
    { value: 'category',      label: t('expenses.sortFields.category') },
    { value: 'payer',         label: t('expenses.sortFields.payer') },
    { value: 'paymentType',   label: t('expenses.sortFields.paymentType') },
    { value: 'splitStrategy', label: t('expenses.sortFields.splitStrategy') },
  ];

  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? 'Unknown';
  const hasUsdExpenses = useMemo(() => expenses.some(e => e.currency === 'USD'), [expenses]);

  const sorted = useMemo(() => {
    const filtered = expenses.filter(e => {
      if (scope === 'unsettled' && INTERNAL_CATEGORIES.has(e.category)) return false;
      if (scope === 'mine' && currentMember && e.payerId !== currentMember.id) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':          cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'description':   cmp = a.description.localeCompare(b.description); break;
        case 'amount':        cmp = a.amount - b.amount; break;
        case 'category':      cmp = a.category.localeCompare(b.category); break;
        case 'payer':         cmp = memberName(a.payerId).localeCompare(memberName(b.payerId)); break;
        case 'paymentType':   cmp = a.paymentType.localeCompare(b.paymentType); break;
        case 'splitStrategy': cmp = a.splitStrategy.type.localeCompare(b.splitStrategy.type); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, sortField, sortOrder, scope, currentMember]);

  // Agrupar por día sólo tiene sentido ordenando por fecha: con cualquier otro orden los
  // encabezados quedarían salteados y repetidos.
  useEffect(() => { onSorted(sorted, sortField === 'date'); }, [sorted, sortField, onSorted]);

  const CHIPS: { value: Scope; label: string }[] = [
    { value: 'all',       label: t('expenses.chipAll') },
    { value: 'unsettled', label: t('expenses.chipUnsettled') },
    { value: 'mine',      label: t('expenses.chipMine') },
  ];

  return (
    <div className="border-b border-line px-5 pb-3 pt-4">
      {/* El conteo dice el alcance en palabras, y por eso cuenta el mes entero y no el filtro. */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-[14px] font-bold text-foreground">
          {isOneTime
            ? t('expenses.countInEvent', { count: expenses.length })
            : t('expenses.countInMonth', { count: expenses.length, month: monthLabel.toLowerCase() })}
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          {isSettled && (
            <span className="rounded-pill bg-positive-wash px-2.5 py-1 text-[11px] font-bold text-positive">
              {t('settle.settledPill')}
            </span>
          )}
          {hasUsdExpenses && blueRate !== null && (
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'original' ? 'ars' : 'original')}
              className={cn(
                'h-8 cursor-pointer rounded-pill px-2.5 text-[11.5px] font-bold transition-colors',
                displayMode === 'ars'
                  ? 'bg-brand-wash text-brand-ink'
                  : 'border border-line-strong text-muted-1 hover:bg-surface-sunken',
              )}
            >
              {displayMode === 'ars' ? t('expenses.viewOriginal') : t('expenses.viewInARS')}
            </button>
          )}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              title={t('expenses.exportPdfTitle')}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-line-strong px-3 text-[11.5px] font-bold text-foreground transition-colors hover:bg-surface-sunken"
            >
              <FileDown className="h-3.5 w-3.5" />
              {isOneTime ? 'PDF' : t('expenses.pdfOfMonth')}
            </button>
          )}
        </div>
      </div>

      {/* Los chips filtran adentro del mes. El orden y la moneda los acompañan a la derecha:
          son ajustes de cómo se lee la lista, no del alcance que el conteo acaba de decir. */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setScope(chip.value)}
              className={cn(
                'h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-pill px-3 text-[11.5px] font-bold transition-colors',
                scope === chip.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-line-strong text-muted-1 hover:bg-surface-sunken',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Select
            value={sortField}
            onValueChange={v => setSortField(v as SortField)}
            open={sortOpen}
            onOpenChange={setSortOpen}
          >
            <SelectTrigger
              aria-label={t('expenses.sortLabel')}
              className="h-8 w-auto gap-1 rounded-pill border-line-strong bg-transparent px-2.5 text-[11.5px] font-semibold text-muted-1 hover:bg-surface-sunken"
            >
              <span className="truncate">{SORT_FIELDS.find(f => f.value === sortField)?.label}</span>
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map(f => (
                <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
            aria-label={t('expenses.sortLabel')}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-1 transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            <ArrowDownUp className={cn('h-3.5 w-3.5 transition-transform', sortOrder === 'asc' && 'rotate-180')} />
          </button>
        </div>
      </div>
    </div>
  );
}
