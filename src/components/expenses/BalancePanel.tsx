import React, { useState } from 'react';
import { formatCurrency } from '@/utils/format';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  onPayTransfer?: (transfer: DebtTransfer) => Promise<void>;
}

export function BalancePanel({
  balances, transfers, members, isSettled,
  onSettleRequest, isSettling,
  onUnsettle, isUnsettling,
  expenses,
  onPayTransfer,
}: BalancePanelProps) {
  const { t } = useTranslation();
  const [pendingTransfer, setPendingTransfer] = useState<DebtTransfer | null>(null);
  const [isPaying, setIsPaying] = useState(false);

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
              const isClickable = !!onPayTransfer;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => isClickable && setPendingTransfer(tr)}
                  className={cn(
                    'w-full flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 bg-muted/50 rounded-xl px-3 py-2.5 text-left',
                    isClickable && '[@media(hover:hover)]:hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer',
                    !isClickable && 'cursor-default',
                  )}
                >
                  {/* Row 1: payer → receiver */}
                  <div className="flex items-center gap-2 min-w-0">
                    <MemberAvatar id={String(tr.fromMemberId)} name={fromName} />
                    <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">
                      {fromName}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0 text-right">
                      {toName}
                    </span>
                    <MemberAvatar id={String(tr.toMemberId)} name={toName} />
                  </div>
                  {/* Amount + optional pay hint */}
                  <div className="flex items-center justify-between lg:justify-start lg:ml-auto lg:flex-shrink-0 gap-2">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(tr.amount)}
                    </span>
                    {isClickable && (
                      <span className="text-[10px] font-semibold text-muted-foreground lg:hidden">
                        {t('balance.tapToPay')}
                      </span>
                    )}
                  </div>
                </button>
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

      {/* ── Pay transfer confirmation dialog ────────────────────────── */}
      <Dialog open={!!pendingTransfer} onOpenChange={(isOpen) => { if (!isOpen && !isPaying) setPendingTransfer(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('balance.payTitle')}</DialogTitle>
          </DialogHeader>
          {pendingTransfer && (
            <div className="flex items-center justify-center gap-4 py-3">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <MemberAvatar id={String(pendingTransfer.fromMemberId)} name={memberName(String(pendingTransfer.fromMemberId))} size="md" />
                <span className="text-xs font-medium text-foreground text-center max-w-[80px] truncate">
                  {memberName(String(pendingTransfer.fromMemberId))}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-bold tabular-nums text-foreground">
                  {formatCurrency(pendingTransfer.amount)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <MemberAvatar id={String(pendingTransfer.toMemberId)} name={memberName(String(pendingTransfer.toMemberId))} size="md" />
                <span className="text-xs font-medium text-foreground text-center max-w-[80px] truncate">
                  {memberName(String(pendingTransfer.toMemberId))}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingTransfer(null)}
              disabled={isPaying}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (!pendingTransfer || !onPayTransfer) return;
                setIsPaying(true);
                try {
                  await onPayTransfer(pendingTransfer);
                  setPendingTransfer(null);
                } finally {
                  setIsPaying(false);
                }
              }}
              disabled={isPaying}
              className="bg-settle/10 text-settle hover:bg-settle/20"
            >
              {isPaying ? t('common.loading') : t('balance.pay')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
