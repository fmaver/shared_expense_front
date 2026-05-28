import React from 'react';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member, ExpenseResponse } from '@/types/expense';

interface BalancePanelProps {
  balances: Record<string, number>;
  members: Member[];
  isSettled: boolean;
  onSettle: () => void;
  isSettling: boolean;
  onUnsettle: () => void;
  isUnsettling: boolean;
  onRecalculate: () => void;
  isRecalculating: boolean;
  expenses: ExpenseResponse[];
}

export function BalancePanel({
  balances, members, isSettled,
  onSettle, isSettling,
  onUnsettle, isUnsettling,
  onRecalculate, isRecalculating,
  expenses,
}: BalancePanelProps) {
  const name = (id: string) => members.find(m => m.id === parseInt(id))?.name ?? 'Unknown';

  const total = expenses.reduce((s, e) =>
    e.category === 'prestamo' || e.category === 'balance' ? s : s + e.amount, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Balance</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onRecalculate} disabled={isRecalculating}>
            <RefreshCw className={cn('h-3 w-3 mr-1', isRecalculating && 'animate-spin')} />
            Recalculate
          </Button>
          {!isSettled ? (
            <Button size="sm" onClick={onSettle} disabled={isSettling}
              className="h-7 px-3 text-xs bg-settle hover:bg-settle/90 text-white font-semibold">
              {isSettling ? 'Settling…' : 'Settle up'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onUnsettle} disabled={isUnsettling}
              className="h-7 px-3 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
              {isUnsettling ? 'Reopening…' : 'Reopen month'}
            </Button>
          )}
        </div>
      </div>

      {isSettled && (
        <div className="flex items-center gap-1.5 text-xs text-settle font-medium mb-3">
          <CheckCircle2 className="h-3.5 w-3.5" /> Month settled
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {Object.entries(balances).map(([id, balance]) => (
          <div key={id} className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">{name(id)}</span>
            <span className={cn('text-sm font-semibold tabular-nums',
              balance > 0 ? 'text-settle' : balance < 0 ? 'text-crimson' : 'text-muted-foreground')}>
              {formatCurrency(balance)}
            </span>
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Total expenses</span>
        <span className="font-semibold text-foreground tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
