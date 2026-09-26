import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { avatarBg, initials } from '@/utils/avatar';
import { formatCurrency } from '@/utils/format';
import { buildTransferExpense } from '@/utils/transfer';
import { logMarked } from '@/utils/settleLog';
import { createExpense } from '@/api/expenses';
import type { DebtTransfer, ExpenseResponse, Member } from '@/types/expense';

interface BalancePanelProps {
  groupId: number;
  balances: Record<string, number>;
  transfers: DebtTransfer[];
  members: Member[];
  isSettled: boolean;
  expenses: ExpenseResponse[];
  currentMemberId: number | null;
  /** Período del registro local de pagos marcados — ver `settleScope`. */
  scope: string;
  /** Abre el plan, que es donde se lee el acuerdo entero. */
  onOpenSettle: () => void;
  /** Refresca el mes después de marcar un pago. */
  onChanged: () => void;
  /** Un grupo de evento no tiene meses, así que el copy no los nombra. */
  isOneTime?: boolean;
  /** Quién todavía no tiene cuenta, para marcarlo junto al nombre. */
  stubMemberIds?: Set<number>;
}

/**
 * Cómo viene el grupo: qué falta para quedar en cero, y quién puso cuánto.
 *
 * Arriba lo que hay que hacer —los pagos pendientes, con el botón para marcar el que ya
 * pasó—, y debajo una tarjeta por persona: cuánto puso, cómo queda, y la barra de aporte de
 * ancho completo al pie. Antes todo era una sola tarjeta con filas apretadas, y la barra de
 * cada uno competía con la de al lado en vez de leerse como el cierre de su propia ficha.
 */
export function BalancePanel({
  groupId, balances, transfers, members, isSettled, expenses, currentMemberId,
  scope, onOpenSettle, onChanged, isOneTime = false, stubMemberIds,
}: BalancePanelProps) {
  const { t } = useTranslation();
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  // Lo puesto por cada uno excluye los movimientos internos: un préstamo no es un gasto
  // del grupo, es plata que ya se movió.
  const realExpenses = expenses.filter(
    e => e.category !== 'prestamo' && e.category !== 'balance',
  );
  const paidBy: Record<number, number> = {};
  for (const e of realExpenses) paidBy[e.payerId] = (paidBy[e.payerId] ?? 0) + e.amount;
  const maxPaid = Math.max(...Object.values(paidBy), 0);
  const total = realExpenses.reduce((s, e) => s + e.amount, 0);

  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? '—';

  const rows = members
    .map(m => ({ member: m, balance: balances[String(m.id)] ?? 0, paid: paidBy[m.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);

  const markPaid = async (transfer: DebtTransfer, index: number) => {
    setBusyIndex(index);
    try {
      const payload = buildTransferExpense(
        transfer, memberName(transfer.fromMemberId), memberName(transfer.toMemberId),
      );
      const { data: created, error } = await createExpense(groupId, payload);
      if (error || !created) { toast.error(error ?? t('toasts.failedSettle')); return; }
      logMarked(scope, created.id);
      onChanged();
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Qué falta para quedar en cero ───────────────────────────────────────────── */}
      <div className="rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="min-w-0 text-[13.5px] font-bold text-foreground">
            {isSettled
              ? t(isOneTime ? 'balance.settledOneTime' : 'balance.monthSettled')
              : transfers.length === 0
                ? t('settle.allSquare')
                : t('balance.movesToZero', { count: transfers.length })}
          </h2>
          {transfers.length > 0 && !isSettled && (
            <button
              type="button"
              onClick={onOpenSettle}
              className="shrink-0 cursor-pointer text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70"
            >
              {t('balance.howQuestion')}
            </button>
          )}
        </div>

        {isSettled ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-positive">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('settle.nobodyOwes')}
          </p>
        ) : transfers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {transfers.map((transfer, index) => (
              <div
                key={`${transfer.fromMemberId}-${transfer.toMemberId}-${index}`}
                className="flex items-center gap-2"
              >
                <span className={cn(
                  'flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-full text-[11px] font-bold text-white',
                  avatarBg(transfer.fromMemberId),
                )}>
                  {initials(memberName(transfer.fromMemberId))}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden="true" />
                <span className={cn(
                  'flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-full text-[11px] font-bold text-white',
                  avatarBg(transfer.toMemberId),
                )}>
                  {initials(memberName(transfer.toMemberId))}
                </span>
                <p className="ml-1 min-w-0 flex-1 truncate text-[12.5px] font-bold tabular-nums text-foreground">
                  {formatCurrency(transfer.amount)}
                </p>
                <button
                  type="button"
                  disabled={busyIndex !== null}
                  onClick={() => markPaid(transfer, index)}
                  className="h-8 shrink-0 cursor-pointer rounded-pill bg-primary px-3.5 text-[11.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busyIndex === index ? '…' : t('balance.markDone')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-[12.5px] font-medium text-muted-1">
            {t(isOneTime ? 'settle.nothingPendingGroup' : 'balance.nothingPendingHere')}
          </p>
        )}
      </div>

      {/* ── Integrantes ─────────────────────────────────────────────────────────────── */}
      <p className="px-1 pt-1 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
        {t('members.whoIsIn')}
      </p>

      {rows.map(({ member, balance, paid }) => {
        const isYou = member.id === currentMemberId;
        const isSquare = Math.abs(balance) <= 0.01;
        return (
          <div key={member.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className={cn(
                'flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full text-[13px] font-bold text-white',
                avatarBg(member.id),
              )}>
                {initials(member.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-[13.5px] font-bold leading-tight text-foreground">
                    {member.name}
                  </p>
                  {isYou && (
                    <span className="shrink-0 rounded-chip bg-brand-wash px-1.5 py-0.5 text-[10.5px] font-bold leading-[1.4] text-brand-ink">
                      {t('expenseDetail.splitYou')}
                    </span>
                  )}
                  {stubMemberIds?.has(member.id) && (
                    <span className="shrink-0 rounded-chip bg-surface-sunken px-1.5 py-0.5 text-[10.5px] font-bold leading-[1.4] text-muted-2">
                      {t('members.noAccount')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11.5px] font-medium leading-tight text-muted-2">
                  {t(isOneTime ? 'balance.putInTrip' : 'balance.putInMonth', {
                    amount: formatCurrency(paid),
                  })}
                </p>
              </div>
              <p className={cn(
                'shrink-0 text-[14px] font-bold tabular-nums',
                isSquare ? 'text-muted-2' : balance > 0 ? 'text-positive' : 'text-negative',
              )}>
                {balance > 0 ? '+' : ''}{formatCurrency(balance)}
              </p>
            </div>

            {/* La barra al pie y de ancho completo: cierra la ficha en vez de competir. */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={cn('h-full rounded-full transition-all', isYou ? 'bg-brand' : 'bg-line-strong')}
                style={{ width: `${maxPaid > 0 ? (paid / maxPaid) * 100 : 0}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* ── Total ───────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11.5px] font-medium text-muted-2">{t('balance.totalExpenses')}</span>
        <span className="text-[12.5px] font-bold tabular-nums text-foreground">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
