import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { avatarBg, initials } from '@/utils/avatar';
import { formatCurrency } from '@/utils/format';
import type { DebtTransfer, ExpenseResponse, Member } from '@/types/expense';

interface BalancePanelProps {
  balances: Record<string, number>;
  transfers: DebtTransfer[];
  members: Member[];
  isSettled: boolean;
  expenses: ExpenseResponse[];
  currentMemberId: number | null;
  /** Abre la hoja de saldar, que es donde vive el acuerdo. */
  onOpenSettle: () => void;
  /** Un grupo de evento no tiene meses, así que el copy no los nombra. */
  isOneTime?: boolean;
  /** Quién todavía no tiene cuenta, para marcarlo junto al nombre. */
  stubMemberIds?: Set<number>;
}

/**
 * Cómo viene el grupo: tu posición arriba, y debajo quién puso cuánto.
 *
 * La cifra protagonista es la tuya — es la pregunta con la que se abre la app —, y el resto
 * se subordina a una fila por persona con su barra de aporte. Saldar no se resuelve acá:
 * este panel es el estado, y el acuerdo pasa a su propia hoja (§6.6).
 */
export function BalancePanel({
  balances, transfers, members, isSettled, expenses, currentMemberId,
  onOpenSettle, isOneTime = false, stubMemberIds,
}: BalancePanelProps) {
  const { t } = useTranslation();

  // Lo puesto por cada uno excluye los movimientos internos: un préstamo no es un gasto
  // del grupo, es plata que ya se movió.
  const realExpenses = expenses.filter(
    e => e.category !== 'prestamo' && e.category !== 'balance',
  );
  const paidBy: Record<number, number> = {};
  for (const e of realExpenses) paidBy[e.payerId] = (paidBy[e.payerId] ?? 0) + e.amount;
  const maxPaid = Math.max(...Object.values(paidBy), 0);
  const total = realExpenses.reduce((s, e) => s + e.amount, 0);

  const yourBalance = currentMemberId != null ? (balances[String(currentMemberId)] ?? 0) : 0;
  const youAreSquare = Math.abs(yourBalance) <= 0.01;

  const rows = members
    .map(m => ({ member: m, balance: balances[String(m.id)] ?? 0, paid: paidBy[m.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {/* ── Tu posición ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          {isSettled ? (
            <>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-positive">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {isOneTime ? t('balance.settledOneTime') : t('balance.monthSettled')}
              </p>
              <p className="mt-1 font-display text-[26px] leading-none text-foreground">
                {t('settle.nobodyOwes')}
              </p>
            </>
          ) : (
            <>
              <p className="text-[12px] font-semibold text-muted-1">
                {t('settle.yourPosition')}
              </p>
              <p
                className={cn(
                  'mt-1 font-display text-[26px] leading-none tabular-nums',
                  youAreSquare ? 'text-foreground' : yourBalance > 0 ? 'text-positive' : 'text-negative',
                )}
              >
                {youAreSquare
                  ? t('settle.allSquare')
                  : yourBalance > 0
                    ? t('settle.youAreOwed', { amount: formatCurrency(yourBalance) })
                    : t('settle.youOwe', { amount: formatCurrency(Math.abs(yourBalance)) })}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenSettle}
          className={cn(
            'h-9 shrink-0 cursor-pointer rounded-pill px-4 text-[12px] font-bold transition-colors',
            isSettled
              ? 'border border-line-strong text-muted-1 hover:bg-surface-sunken'
              : 'bg-ink text-paper hover:opacity-90 dark:bg-paper dark:text-ink',
          )}
        >
          {/* El botón abre la hoja; reabrir de verdad se decide adentro, con el contexto
              del cierre a la vista. Prometer "Reabrir" acá y pedirlo dos veces confunde. */}
          {isSettled ? t('settle.viewClosing') : t('balance.settleUp')}
        </button>
      </div>

      {/* ── Quién puso cuánto ───────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3 px-5 pb-4">
        {rows.map(({ member, balance, paid }) => {
          const isYou = member.id === currentMemberId;
          return (
            <div key={member.id}>
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  'flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-full text-[11px] font-bold text-white',
                  avatarBg(member.id),
                )}>
                  {initials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-foreground">
                    {member.name}
                    {isYou && <span className="font-medium text-muted-2"> · {t('expenseDetail.splitYou')}</span>}
                    {stubMemberIds?.has(member.id) && (
                      <span className="font-medium text-muted-2"> · {t('members.noAccount')}</span>
                    )}
                  </p>
                  <p className="text-[11.5px] font-medium tabular-nums text-muted-2">
                    {formatCurrency(paid)}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-[13px] font-bold tabular-nums',
                    Math.abs(balance) <= 0.01 ? 'text-muted-2'
                      : balance > 0 ? 'text-positive' : 'text-negative',
                  )}
                >
                  {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                </p>
              </div>
              {/* Barra de proporción de aporte */}
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className={cn('h-full rounded-full transition-all', isYou ? 'bg-brand' : 'bg-line-strong')}
                  style={{ width: `${maxPaid > 0 ? (paid / maxPaid) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Total ───────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <span className="text-[11.5px] font-medium text-muted-2">{t('balance.totalExpenses')}</span>
        <span className="text-[12.5px] font-bold tabular-nums text-foreground">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Cuántos pagos faltan, como anticipo de lo que abre el botón */}
      {!isSettled && transfers.length > 0 && (
        <button
          type="button"
          onClick={onOpenSettle}
          className="w-full cursor-pointer border-t border-line bg-brand-wash px-5 py-3 text-left text-[11.5px] font-bold text-brand-ink transition-opacity hover:opacity-80"
        >
          {t('settle.pendingPayments', { count: transfers.length })}
        </button>
      )}
    </div>
  );
}
