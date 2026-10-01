import { useEffect, useMemo, useState } from 'react';
import { Check, SlidersHorizontal, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { parseQuery, matchesQuery } from '@/utils/search';
import { formatCurrency } from '@/utils/format';
import type { ExpenseResponse, Member } from '@/types/expense';

type SortField = 'date' | 'description' | 'amount' | 'category' | 'payer' | 'paymentType' | 'splitStrategy';
type SortOrder = 'asc' | 'desc';

/**
 * El único toggle que queda es "Míos". La lupa del mes reemplaza al chip "Sin saldar": buscar
 * texto o monto dentro del mes excluye `balance`/`prestamo` porque nadie busca esas filas —
 * pero sólo mientras hay una búsqueda activa; sin query la lista se ve igual que siempre.
 */
type Filter = 'mine';

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
  /**
   * El texto del buscador del mes, hacia arriba — la página lo necesita para resaltar
   * coincidencias en `ExpenseRow` y para el link "Buscar en todos los meses ›" debajo de la
   * tarjeta (V8.c). No es un valor controlado: el input sigue viviendo acá adentro.
   */
  onQueryChange?: (query: string) => void;
}

export function ExpenseListHeader({
  expenses, members, onSorted, monthLabel, isOneTime = false, onExportPdf, isSettled = false,
  onQueryChange,
}: ExpenseListHeaderProps) {
  const { t } = useTranslation();
  const { displayMode, setDisplayMode, blueRate } = useCurrency();
  const currentMember = useCurrentMember();

  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const toggleFilter = (f: Filter) => setFilters(prev => {
    const next = new Set(prev);
    if (next.has(f)) next.delete(f); else next.add(f);
    return next;
  });
  const [monthQuery, setMonthQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

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
  // Un grupo de evento no tiene "este mes": el placeholder lo dice en vez de nombrar un mes
  // que no corresponde al alcance real de la búsqueda (toda la vida del evento).
  const searchPlaceholder = isOneTime ? t('search.inEvent') : t('search.inMonth', { month: monthLabel.toLowerCase() });

  const parsed = useMemo(() => parseQuery(monthQuery), [monthQuery]);

  useEffect(() => { onQueryChange?.(monthQuery); }, [monthQuery, onQueryChange]);

  const sorted = useMemo(() => {
    const filtered = expenses.filter(e => {
      if (filters.has('mine') && currentMember && e.payerId !== currentMember.id) return false;
      if (parsed) {
        if (e.category === 'balance' || e.category === 'prestamo') return false;
        if (!matchesQuery([e.description, memberName(e.payerId)], e.amount, parsed)) return false;
      }
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
  }, [expenses, sortField, sortOrder, filters, currentMember, parsed]);

  // Agrupar por día sólo tiene sentido ordenando por fecha: con cualquier otro orden los
  // encabezados quedarían salteados y repetidos.
  useEffect(() => { onSorted(sorted, sortField === 'date'); }, [sorted, sortField, onSorted]);

  const CHIPS: { value: Filter; label: string }[] = [
    { value: 'mine', label: t('expenses.chipMine') },
  ];

  // El total es del mes entero, no del filtro — por eso suma `expenses` (la prop, sin filtrar)
  // y no `sorted`. Los movimientos de saldo/préstamo no son gasto real del mes (mismo criterio
  // que el resumen de Números). La cifra no convierte USD a ARS (igual que ese resumen): es una
  // suma simple, no el balance.
  const monthTotal = useMemo(
    () => expenses
      .filter(e => e.category !== 'balance' && e.category !== 'prestamo')
      .reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );
  const monthTotalLabel = isOneTime
    ? formatCurrency(monthTotal)
    : t('expenses.totalInMonth', { amount: formatCurrency(monthTotal), month: monthLabel.toLowerCase() });

  const hasQuery = parsed !== null;
  // La pluralización depende del total ("1 de 2 gastos" lee en plural aunque haya un sólo
  // resultado): `count` maneja el singular/plural de i18next, `matched` es la cifra filtrada.
  const countLabel = hasQuery
    ? t('expenses.countFiltered', { count: expenses.length, matched: sorted.length })
    : t('expenses.countPlain', { count: expenses.length });

  return (
    <div className="border-b border-line px-5 pb-3 pt-4">
      {/* El conteo dice el alcance en palabras; el total, al lado en gris, es siempre el del
          mes entero — por eso no cambia cuando el filtro deja la lista en cero. */}
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="min-w-0 truncate text-[13.5px] font-bold text-foreground">
          {countLabel}
          <span className="ml-1 font-medium text-muted-1">· {monthTotalLabel}</span>
        </h2>

        <div className="flex shrink-0 items-center gap-2.5">
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
          {/* "PDF" pasa a link de texto (V8.c): ya no es un botón con borde e ícono. */}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              title={t('expenses.exportPdfTitle')}
              className="shrink-0 cursor-pointer text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70"
            >
              {isOneTime ? 'PDF' : t('expenses.pdfOfMonth')}
            </button>
          )}
        </div>
      </div>

      {/* Fila única de 34px (V8.c): el buscador se estira, "Míos" y el botón de orden la cierran. */}
      <div className="mt-2.5 flex h-[34px] items-center gap-1.5">
        {/* El input vive siempre montado (regla de iOS): el foco corre sincrónico dentro del
            tap porque el `<label>` lo asocia nativamente, sin depender de un handler en JS. */}
        <label
          htmlFor="month-search-input"
          className={cn(
            'flex h-[34px] min-w-0 flex-1 cursor-text items-center gap-1.5 rounded-full border-[1.5px] bg-surface-sunken pl-2.5 pr-1 transition-colors',
            monthQuery || inputFocused ? 'border-brand-soft' : 'border-transparent',
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-1" aria-hidden="true" />
          <input
            id="month-search-input"
            type="search"
            enterKeyHint="search"
            value={monthQuery}
            onChange={e => setMonthQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-foreground outline-none placeholder:text-muted-2 lg:text-[12.5px] [&::-webkit-search-cancel-button]:hidden"
          />
          {monthQuery && (
            <button
              type="button"
              onClick={() => setMonthQuery('')}
              aria-label={t('search.close')}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-muted-1 hover:bg-line"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        {CHIPS.map(chip => (
          <button
            key={chip.value}
            type="button"
            onClick={() => toggleFilter(chip.value)}
            aria-pressed={filters.has(chip.value)}
            className={cn(
              'h-[34px] shrink-0 cursor-pointer whitespace-nowrap rounded-pill px-3 text-[11.5px] font-bold transition-colors',
              filters.has(chip.value)
                ? 'bg-primary text-primary-foreground'
                : 'border border-line-strong text-muted-1 hover:bg-surface-sunken',
            )}
          >
            {chip.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
          aria-label={t('expenses.sortSheetTitle')}
          className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong text-muted-1 transition-colors hover:bg-surface-sunken hover:text-foreground"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ruling 2: la hoja sólo tiene el campo de orden existente y la dirección — nada de
          rango de fechas. */}
      <Dialog open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('expenses.sortSheetTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-0.5">
            {SORT_FIELDS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setSortField(f.value)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors',
                  sortField === f.value
                    ? 'bg-brand-wash text-brand-ink'
                    : 'text-foreground hover:bg-surface-sunken',
                )}
              >
                {f.label}
                {sortField === f.value && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-[12.5px] font-semibold text-muted-1">{t('expenses.sortLabel')}</span>
            <button
              type="button"
              onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-line-strong px-3 text-[12px] font-bold text-foreground hover:bg-surface-sunken"
            >
              {sortOrder === 'asc' ? t('expenses.sortAsc') : t('expenses.sortDesc')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
