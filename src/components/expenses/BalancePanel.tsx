import React from 'react';
import { formatCurrency } from '@/utils/format';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { DebtTransfer, Member, ExpenseResponse } from '@/types/expense';

// Deterministic avatar palette — cycles by member ID so each person always gets
// the same hue across sessions without needing to store a colour preference.
const AVATAR_PALETTE = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-sky-100    text-sky-700    dark:bg-sky-900/40    dark:text-sky-300',
  'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  'bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300',
  'bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
];

function avatarColor(id: string) {
  return AVATAR_PALETTE[parseInt(id) % AVATAR_PALETTE.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MemberAvatar({ id, name, size = 'sm' }: { id: string; name: string; size?: 'sm' | 'md' }) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none',
        avatarColor(id),
        size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs',
      )}
    >
      {initials(name)}
    </div>
  );
}

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

  const memberName = (id: string) =>
    members.find(m => m.id === parseInt(id))?.name ?? 'Unknown';

  const total = expenses.reduce((s, e) =>
    e.category === 'prestamo' || e.category === 'balance' ? s : s + e.amount, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('balance.title')}</h3>
          {isSettled && (
            <div className="flex items-center gap-1 text-xs text-settle font-medium mt-0.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>{t('balance.monthSettled')}</span>
            </div>
          )}
        </div>

        {!isSettled ? (
          <button
            type="button"
            onClick={onSettleRequest}
            disabled={isSettling}
            className="h-7 px-3 text-xs rounded-full font-semibold bg-settle/10 text-settle hover:bg-settle/20 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSettling ? t('balance.settling') : t('balance.settleUp')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onUnsettle}
            disabled={isUnsettling}
            className="h-7 px-3 text-xs rounded-full font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:hover:bg-orange-950 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isUnsettling ? t('balance.reopening') : t('balance.reopenMonth')}
          </button>
        )}
      </div>

      <Separator />

      {/* ── Member balances ─────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2">
        {Object.entries(balances).map(([id, balance]) => {
          const isPos = balance > 0;
          const isNeg = balance < 0;
          return (
            <div key={id} className="flex items-center gap-3">
              <MemberAvatar id={id} name={memberName(id)} />
              <span className="flex-1 text-sm text-foreground truncate">
                {memberName(id)}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  isPos ? 'text-settle' : isNeg ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {isPos ? '+' : ''}{formatCurrency(balance)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Transfers (who pays whom) ────────────────────────────────── */}
      {!isSettled && transfers.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              {t('balance.transfers')}
            </p>
            {transfers.map((tr, i) => {
              const fromName = memberName(String(tr.fromMemberId));
              const toName   = memberName(String(tr.toMemberId));
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5"
                >
                  {/* Payer */}
                  <MemberAvatar id={String(tr.fromMemberId)} name={fromName} />
                  <span className="text-xs text-foreground truncate flex-1 min-w-0">
                    {fromName}
                  </span>

                  {/* Arrow */}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

                  {/* Receiver */}
                  <span className="text-xs text-foreground truncate flex-1 min-w-0 text-right">
                    {toName}
                  </span>
                  <MemberAvatar id={String(tr.toMemberId)} name={toName} />

                  {/* Amount */}
                  <span className="text-sm font-bold tabular-nums text-foreground flex-shrink-0 pl-1">
                    {formatCurrency(tr.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Total ───────────────────────────────────────────────────── */}
      <Separator />
      <div className="flex justify-between items-center px-4 py-3 text-xs">
        <span className="text-muted-foreground">{t('balance.totalExpenses')}</span>
        <span className="font-semibold text-foreground tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
