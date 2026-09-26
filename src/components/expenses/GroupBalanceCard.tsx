import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

interface GroupBalanceCardProps {
  isOneTime: boolean;
  /** El mes que se está mirando, en minúscula ("julio"). En un evento no se usa. */
  monthName: string;
  balances: Record<string, number>;
  currentMemberId: number | null;
  onOpenSettle: () => void;
}

/**
 * Cómo venís vos en este grupo, arriba de la lista.
 *
 * Es lo primero que se pregunta al abrir un grupo — "¿tengo a favor o debo?" —, y por eso va
 * antes que nada; pero es una fila sin caja, no una tarjeta con botones (ADDENDUM-violeta.md §5).
 * Saldar y recordar viven en el flujo que abre "Cómo saldar ›".
 */
export function GroupBalanceCard({
  isOneTime, monthName, balances, currentMemberId, onOpenSettle,
}: GroupBalanceCardProps) {
  const { t } = useTranslation();

  const yourBalance = currentMemberId != null ? (balances[String(currentMemberId)] ?? 0) : 0;
  const isSquare = Math.abs(yourBalance) <= 0.01;
  const owed = yourBalance > 0;

  return (
    <div className="flex items-end gap-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-semibold text-muted-1">
          {isOneTime ? t('expenses.balanceInEvent') : t('expenses.balanceInMonth', { month: monthName })}
        </p>
        <p className="mt-1 flex items-baseline gap-[7px]">
          <span
            className={cn(
              'text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em] tabular-nums',
              isSquare ? 'text-foreground' : owed ? 'text-positive' : 'text-negative',
            )}
          >
            {isSquare ? formatCurrency(0) : `${owed ? '+' : '−'}${formatCurrency(Math.abs(yourBalance))}`}
          </span>
          <span className="text-[12px] font-semibold text-muted-1">
            {t(isSquare ? 'expenses.balanceSquare' : owed ? 'expenses.balanceOwed' : 'expenses.balanceOwe')}
          </span>
        </p>
      </div>
      {!isSquare && (
        <button
          type="button"
          onClick={onOpenSettle}
          className="shrink-0 cursor-pointer pb-1 text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70"
        >
          {t('expenses.howToSettle')}
        </button>
      )}
    </div>
  );
}
