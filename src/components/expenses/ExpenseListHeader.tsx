import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { ExpenseResponse, Member } from '@/types/expense';

type SortField = 'date' | 'description' | 'amount' | 'category' | 'payer' | 'paymentType' | 'splitStrategy';
type SortOrder = 'asc' | 'desc';

interface ExpenseListHeaderProps {
  expenses: ExpenseResponse[];
  members: Member[];
  onSorted: (sorted: ExpenseResponse[]) => void;
}

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'date',          label: 'Date' },
  { value: 'amount',        label: 'Amount' },
  { value: 'description',   label: 'Description' },
  { value: 'category',      label: 'Category' },
  { value: 'payer',         label: 'Payer' },
  { value: 'paymentType',   label: 'Payment type' },
  { value: 'splitStrategy', label: 'Split type' },
];

export function ExpenseListHeader({ expenses, members, onSorted }: ExpenseListHeaderProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterPayer, setFilterPayer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? 'Unknown';

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  const sorted = useMemo(() => {
    const filtered = expenses.filter(e => {
      if (filterPayer !== 'all' && e.payerId !== parseInt(filterPayer)) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
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
  }, [expenses, sortField, sortOrder, filterPayer, filterCategory]);

  React.useEffect(() => { onSorted(sorted); }, [sorted, onSorted]);

  const toggleOrder = () => setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
      {/* Sort field */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Sort</span>
        <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
          <SelectTrigger className="h-7 text-xs w-36 bg-card">
            <SelectValue />
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
        <span className="text-xs text-muted-foreground">Payer</span>
        <Select value={filterPayer} onValueChange={setFilterPayer}>
          <SelectTrigger className="h-7 text-xs w-28 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id.toString()} className="text-xs">{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter by category */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Category</span>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-7 text-xs w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
