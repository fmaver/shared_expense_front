import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { avatarBg, initials } from '@/utils/avatar';
import { buildTransferExpense } from '@/utils/transfer';
import { createExpense } from '@/api/expenses';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { PendingGroupTransfers } from '@/hooks/usePendingTransfers';

interface SettleUpCardProps {
  group: PendingGroupTransfers;
  currentMemberId: number;
  onPaid: () => void;
}

/**
 * "Para cerrar Casa" — los pagos que faltan para que un grupo quede en cero.
 *
 * Marcar un pago acá anota el movimiento en el grupo, igual que hacerlo desde adentro: la
 * plata se mueve una sola vez y los dos lugares cuentan la misma historia.
 */
export function SettleUpCard({ group, currentMemberId, onPaid }: SettleUpCardProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [payingIndex, setPayingIndex] = useState<number | null>(null);

  const memberName = (id: number) => group.members.find(m => m.id === id)?.name ?? '—';

  const markPaid = async (index: number) => {
    const transfer = group.transfers[index];
    setPayingIndex(index);
    try {
      const expense = buildTransferExpense(
        transfer,
        memberName(transfer.fromMemberId),
        memberName(transfer.toMemberId),
      );
      const { error } = await createExpense(group.groupId, expense);
      if (error) { toast.error(error); return; }
      toast.success(t('toasts.expenseAdded'));
      onPaid();
    } finally {
      setPayingIndex(null);
    }
  };

  return (
    <div className="rounded-card-lg border border-brand-wash-line bg-brand-wash p-4">
      <h2 className="text-[13px] font-bold text-brand-ink">
        {t('personal.settleCard', { group: group.groupName })}
      </h2>

      <div className="mt-3 space-y-2">
        {group.transfers.map((transfer, i) => {
          // Si el que paga sos vos, el otro es quien cobra; si no, el otro te paga a vos.
          const theyPayYou = transfer.toMemberId === currentMemberId;
          const otherId = theyPayYou ? transfer.fromMemberId : transfer.toMemberId;
          const otherName = memberName(otherId);
          return (
            <div key={`${transfer.fromMemberId}-${transfer.toMemberId}-${i}`} className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-full text-[11px] font-bold text-white',
                  avatarBg(otherId),
                )}
                aria-hidden="true"
              >
                {initials(otherName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-foreground">
                  {theyPayYou
                    ? t('personal.theyPayYou', { name: otherName })
                    : t('personal.youPayThem', { name: otherName })}
                </p>
                <p className="text-[12.5px] font-bold tabular-nums text-foreground">
                  {formatAmount(transfer.amount, 'ARS')}
                </p>
              </div>
              <button
                type="button"
                disabled={payingIndex !== null}
                onClick={() => markPaid(i)}
                className="h-8 shrink-0 cursor-pointer rounded-pill bg-ink px-3.5 text-[11.5px] font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-paper dark:text-ink"
              >
                {payingIndex === i
                  ? '…'
                  : theyPayYou ? t('personal.markCollected') : t('personal.markPaid')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
