import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import type { PendingGroupTransfers } from '@/hooks/usePendingTransfers';

interface SettleUpCardProps {
  group: PendingGroupTransfers;
  currentMemberId: number;
  year: number;
  month: number;
}

/**
 * "Para cerrar" — una línea por grupo con saldo abierto.
 *
 * Antes esto era una tarjeta con una fila por persona y un botón de marcar en cada una: el home
 * personal terminaba teniendo la mitad de la pantalla de saldar, con la misma acción en dos
 * lugares. Acá dice sólo cómo venís y cuánto falta, y "Saldar" lleva a la pantalla donde eso
 * se hace de verdad.
 */
export function SettleUpCard({ group, currentMemberId, year, month }: SettleUpCardProps) {
  const { t } = useTranslation();

  const months = t('months', { returnObjects: true }) as string[];
  const monthName = (months[month - 1] ?? '').toLocaleLowerCase();

  /* Tu posición en el grupo: la suma de lo que cobrás menos lo que pagás. */
  const net = group.transfers.reduce(
    (sum, tr) => sum + (tr.toMemberId === currentMemberId ? tr.amount : -tr.amount),
    0,
  );
  const theyOweYou = net > 0;

  return (
    <div className="flex items-center gap-3 rounded-card-lg border border-brand-wash-line bg-brand-wash p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-brand-ink">
          {t(theyOweYou ? 'personal.settleOwedLine' : 'personal.settleOweLine', {
            amount: formatCurrency(Math.abs(net)),
            group: group.groupName,
          })}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] font-medium text-brand-ink/75">
          {t('personal.settleMoves', { count: group.transfers.length, month: monthName })}
        </p>
      </div>
      <Link
        to={`/groups/${group.groupId}/settle?year=${year}&month=${month}`}
        className={cn(
          'flex h-9 shrink-0 items-center rounded-pill bg-ink px-4 text-[12px] font-bold text-paper',
          'transition-opacity hover:opacity-90 dark:bg-paper dark:text-ink',
        )}
      >
        {t('personal.settleAction')}
      </Link>
    </div>
  );
}
