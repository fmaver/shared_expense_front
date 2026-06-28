import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import type { ExpenseResponse, Member } from '@/types/expense';

type SortField = 'date' | 'description' | 'amount' | 'category' | 'payer' | 'paymentType' | 'splitStrategy';
type SortOrder = 'asc' | 'desc';

interface ExpenseListHeaderProps {
  expenses: ExpenseResponse[];
  members: Member[];
  onSorted: (sorted: ExpenseResponse[]) => void;
}

export function ExpenseListHeader({ expenses, members, onSorted }: ExpenseListHeaderProps) {
  const { t } = useTranslation();
  const { displayMode, setDisplayMode, blueRate } = useCurrency();
  const [sortField, setSortField] = useState<SortField>('date');

  const SORT_FIELDS: { value: SortField; label: string }[] = [
    { value: 'date',          label: t('expenses.sortFields.date') },
    { value: 'amount',        label: t('expenses.sortFields.amount') },
    { value: 'description',   label: t('expenses.sortFields.description') },
    { value: 'category',      label: t('expenses.sortFields.category') },
    { value: 'payer',         label: t('expenses.sortFields.payer') },
    { value: 'paymentType',   label: t('expenses.sortFields.paymentType') },
    { value: 'splitStrategy', label: t('expenses.sortFields.splitStrategy') },
  ];
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterPayer, setFilterPayer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRecurring, setFilterRecurring] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? 'Unknown';

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  const hasUsdExpenses = useMemo(() => expenses.some(e => e.currency === 'USD'), [expenses]);

  const sorted = useMemo(() => {
    const filtered = expenses.filter(e => {
      if (filterPayer !== 'all' && e.payerId !== parseInt(filterPayer)) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterRecurring === 'recurring' && e.recurringTemplateId == null) return false;
      if (filterRecurring === 'one-time' && e.recurringTemplateId != null) return false;
      if (filterCurrency !== 'all' && (e.currency ?? 'ARS') !== filterCurrency) return false;
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
  }, [expenses, sortField, sortOrder, filterPayer, filterCategory, filterRecurring, filterCurrency]);

  React.useEffect(() => { onSorted(sorted); }, [sorted, onSorted]);

  const toggleOrder = () => setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
      {/* Sort field */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground w-16 shrink-0">{t('expenses.sort')}</span>
        <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
          <SelectTrigger className="h-7 text-xs w-36 bg-card">
            <span className="truncate">{SORT_FIELDS.find(f => f.value === sortField)?.label ?? sortField}</span>
          </SelectTrigger>
          <SelectContent>
            {SORT_FIELDS.map(f => (
              <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleOrder}
          aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
          <SortIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Filter by payer */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground w-16 shrink-0">{t('expenses.payer')}</span>
        <Select value={filterPayer} onValueChange={setFilterPayer}>
          <SelectTrigger className="h-7 text-xs w-28 bg-card">
            <span className="truncate">
              {filterPayer === 'all' ? t('expenses.all') : members.find(m => m.id.toString() === filterPayer)?.name ?? filterPayer}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{t('expenses.all')}</SelectItem>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id.toString()} className="text-xs">{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter by category */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground w-16 shrink-0">{t('expenses.category')}</span>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-7 text-xs w-36 bg-card">
            <span className="truncate capitalize">{filterCategory === 'all' ? t('expenses.all') : filterCategory}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{t('expenses.all')}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter by recurring */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground w-16 shrink-0">{t('expenses.type')}</span>
        <Select value={filterRecurring} onValueChange={setFilterRecurring}>
          <SelectTrigger className="h-7 text-xs w-28 bg-card">
            <span className="truncate">
              {filterRecurring === 'all' ? t('expenses.all')
                : filterRecurring === 'recurring' ? t('expenses.filterRecurring')
                : t('expenses.filterOneTime')}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{t('expenses.all')}</SelectItem>
            <SelectItem value="recurring" className="text-xs">{t('expenses.filterRecurring')}</SelectItem>
            <SelectItem value="one-time" className="text-xs">{t('expenses.filterOneTime')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency filter + display toggle — only when USD expenses exist */}
      {hasUsdExpenses && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-16 shrink-0">{t('expenses.currency')}</span>
            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="h-7 text-xs w-24 bg-card">
                <span className="truncate">
                  {filterCurrency === 'all' ? t('expenses.all') : filterCurrency}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t('expenses.all')}</SelectItem>
                <SelectItem value="ARS" className="text-xs">ARS</SelectItem>
                <SelectItem value="USD" className="text-xs">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {blueRate !== null && (
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'original' ? 'ars' : 'original')}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ml-auto',
                displayMode === 'ars'
                  ? 'bg-brand/20 text-brand hover:bg-brand/30'
                  : 'text-muted-foreground border border-border hover:bg-accent hover:text-foreground',
              )}
            >
              {displayMode === 'ars' ? t('expenses.viewOriginal') : t('expenses.viewInARS')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
