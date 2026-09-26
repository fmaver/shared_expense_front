import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import type { DebtTransfer, ExpenseResponse, Member } from '@/types/expense';

interface GroupBalanceCardProps {
  isOneTime: boolean;
  groupName: string;
  balances: Record<string, number>;
  transfers: DebtTransfer[];
  expenses: ExpenseResponse[];
  members: Member[];
  currentMemberId: number | null;
  onOpenSettle: () => void;
  onRemind: () => void;
}

/**
 * Cómo venís vos en este grupo, arriba de todo.
 *
 * Es lo primero que se pregunta al abrir un grupo — "¿tengo a favor o debo?" — y la lista de
 * gastos sola no lo contesta. En un evento la pregunta es la misma pero el encuadre cambia:
 * no hay mes que cerrar, así que en vez de "saldar" se habla de pagar tu parte.
 */
export function GroupBalanceCard({
  isOneTime, groupName, balances, transfers, expenses, members, currentMemberId,
  onOpenSettle, onRemind,
}: GroupBalanceCardProps) {
  const { t } = useTranslation();

  const yourBalance = currentMemberId != null ? (balances[String(currentMemberId)] ?? 0) : 0;
  const isSquare = Math.abs(yourBalance) <= 0.01;
  const owed = yourBalance > 0;

  const realExpenses = expenses.filter(
    e => e.category !== 'prestamo' && e.category !== 'balance',
  );
  const totalSpent = realExpenses.reduce((s, e) => s + e.amount, 0);

  /*
    A quién le debés la mayor parte, y por qué.
    En un viaje el saldo suele concentrarse en quien puso el gasto grande — la cabaña, los
    pasajes —, y decirlo con nombre y cosa ahorra abrir el plan para entenderlo.
  */
  const biggestCreditor = (() => {
    if (currentMemberId == null || yourBalance >= 0) return null;
    const mine = transfers.filter(tr => tr.fromMemberId === currentMemberId);
    const biggest = [...mine].sort((a, b) => b.amount - a.amount)[0];
    if (!biggest) return null;
    const name = members.find(m => m.id === biggest.toMemberId)?.name;
    if (!name) return null;
    const theirBiggest = realExpenses
      .filter(e => e.payerId === biggest.toMemberId)
      .sort((a, b) => b.amount - a.amount)[0];
    if (!theirBiggest) return null;
    return { name, what: theirBiggest.description.toLocaleLowerCase() };
  })();

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12.5px] font-semibold text-muted-1">
          {isSquare
            ? t('expenses.squareGroup')
            : isOneTime
              ? t(owed ? 'expenses.favourFromTrip' : 'expenses.oweTheTrip')
              : t(owed ? 'expenses.inYourFavour' : 'expenses.youOweGroup')}
        </p>
        {isOneTime && totalSpent > 0 && (
          <p className="shrink-0 text-[12px] font-medium tabular-nums text-muted-2">
            {t('expenses.spentTotal', { amount: formatCurrency(totalSpent) })}
          </p>
        )}
      </div>

      {!isSquare && (
        <p
          className={cn(
            'mt-1 font-display text-[40px] leading-none tabular-nums',
            owed ? 'text-positive' : 'text-negative',
          )}
        >
          {owed ? '+' : '−'}{formatCurrency(Math.abs(yourBalance))}
        </p>
      )}

      {biggestCreditor && (
        <p className="mt-2.5 text-[12.5px] font-medium leading-[1.45] text-muted-1">
          {t('expenses.mostlyTo', { name: biggestCreditor.name, what: biggestCreditor.what })}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onOpenSettle}
          className="h-11 flex-1 cursor-pointer rounded-[12px] bg-ink text-[13px] font-bold text-paper transition-opacity hover:opacity-90 dark:bg-paper dark:text-ink"
        >
          {isOneTime && !owed ? t('expenses.payMyPart') : t('expenses.settleAccounts')}
        </button>
        <button
          type="button"
          onClick={isOneTime ? onOpenSettle : onRemind}
          className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-surface-sunken px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-line"
        >
          {isOneTime ? (
            t('expenses.seePlan')
          ) : (
            <>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {t('expenses.remind')}
            </>
          )}
        </button>
      </div>

      {/* El nombre del grupo sólo aparece cuando hace falta desambiguar en el copy. */}
      <span className="sr-only">{groupName}</span>
    </div>
  );
}
