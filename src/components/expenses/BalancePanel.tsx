import React from 'react';
import { formatCurrency } from '@/utils/format';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { DebtTransfer, Member, ExpenseResponse } from '@/types/expense';

interface BalancePanelProps {
  balances: Record<string, number>;
  transfers: DebtTransfer[];
  members: Member[];
  isSettled: boolean;
  onSettleRequest: () => void;
  isSettling: boolean;
  onUnsettle: () => void;
  isUnsettling: boolean;
  expenses: ExpenseResponse[];
}

export function BalancePanel({
  balances, transfers, members, isSettled,
  onSettleRequest, isSettling,
  onUnsettle, isUnsettling,
  expenses,
}: BalancePanelProps) {
  const { t } = useTranslation();
  const name = (id: string) => members.find(m => m.id === parseInt(id))?.name ?? 'Unknown';

  const total = expenses.reduce((s, e) =>
    e.category === 'prestamo' || e.category === 'balance' ? s : s + e.amount, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{t('balance.title')}</h3>
        <div className="flex items-center gap-1.5">
          {!isSettled ? (
            <button
              type="button"
              onClick={onSettleRequest}
              disabled={isSettling}
              className="h-7 px-3 text-xs rounded-md font-semibold border border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 dark:hover:bg-green-950/40 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSettling ? t('balance.settling') : t('balance.settleUp')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onUnsettle}
              disabled={isUnsettling}
              className="h-7 px-3 text-xs rounded-md font-medium border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isUnsettling ? t('balance.reopening') : t('balance.reopenMonth')}
            </button>
          )}
        </div>
      </div>

      {isSettled && (
        <div className="flex items-center gap-1.5 text-xs text-settle font-medium mb-3">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t('balance.monthSettled')}
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
      {!isSettled && transfers.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {t('balance.transfers')}
          </p>
          {transfers.map((tr, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">{name(String(tr.fromMemberId))}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{name(String(tr.toMemberId))}</span>
              <span className="font-semibold tabular-nums text-foreground ml-auto">
                {formatCurrency(tr.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">
        {t('balance.legend')}
      </p>

      <Separator className="my-3" />

      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{t('balance.totalExpenses')}</span>
        <span className="font-semibold text-foreground tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
