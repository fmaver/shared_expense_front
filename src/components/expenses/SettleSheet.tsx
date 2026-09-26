import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { avatarBg, initials } from '@/utils/avatar';
import { capitalize, formatCurrency } from '@/utils/format';
import { shareReminder } from '@/utils/remind';
import { logReminded } from '@/utils/settleLog';
import type { DebtTransfer, ExpenseResponse, Member } from '@/types/expense';

interface SettleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  month: number;
  isOneTime: boolean;
  members: Member[];
  transfers: DebtTransfer[];
  expenses: ExpenseResponse[];
  currentMemberId: number | null;
  /** Período al que se le anotan los avisos — ver `settleScope`. */
  scope: string;
  /** Abre la pantalla de progreso, donde los pagos se marcan de a uno. */
  onMarkOneByOne: () => void;
}

/**
 * El plan: qué pagos dejan el mes en cero.
 *
 * Las tarjetas **no llevan botones**. Son la foto del acuerdo —quién le pasa cuánto a quién y
 * por qué—, y leerla es lo único que se hace acá. Las dos cosas que sí se pueden hacer viven al
 * pie, donde se decide una vez: avisarles a todos de una, o pasar a marcarlos uno por uno.
 *
 * Marcar, deshacer y ver cómo va la cosa son otra pantalla (`SettleProgressPage`): una hoja que
 * cambia de forma mientras la plata se mueve es difícil de volver a encontrar.
 */
export function SettleSheet({
  open, onOpenChange, groupName, month, isOneTime, members, transfers, expenses,
  currentMemberId, scope, onMarkOneByOne,
}: SettleSheetProps) {
  const { t } = useTranslation();

  const months = t('months', { returnObjects: true }) as string[];
  const monthName = months[month - 1] ?? '';
  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? '—';

  const realExpenses = expenses.filter(e => e.category !== 'prestamo' && e.category !== 'balance');

  /** De dónde sale el saldo, dicho como se dice en voz alta: "súper, internet y sofá". */
  const reasonItems = (() => {
    const names = [...new Set(realExpenses.map(e => e.description.toLocaleLowerCase()))].slice(0, 3);
    if (names.length <= 1) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} ${t('groups.and')} ${names[names.length - 1]}`;
  })();

  /** Todos los que aparecen en el plan menos vos: los que van a recibir el aviso. */
  const others = [...new Set(
    transfers.flatMap(tr => [tr.fromMemberId, tr.toMemberId]),
  )].filter(id => id !== currentMemberId);

  const notifyLabel = others.length === 1
    ? t('settle.notifyOne', { name: memberName(others[0]) })
    : others.length === 2
      ? t('settle.notifyBoth')
      : t('settle.notifyAll', { count: others.length });

  /**
   * Un solo mensaje que nombra cada pago del plan.
   *
   * Mandar uno por persona obliga a repetir la conversación tantas veces como gente haya; el
   * plan es uno y se entiende mejor entero, con los dos movimientos a la vista.
   */
  const notifyEveryone = async () => {
    const header = isOneTime
      ? t('settle.planShareHeaderGroup', { group: groupName })
      : t('settle.planShareHeader', { group: groupName, month: monthName.toLocaleLowerCase() });
    const lines = transfers.map(tr => t('settle.planShareLine', {
      from: memberName(tr.fromMemberId),
      to: memberName(tr.toMemberId),
      amount: formatCurrency(tr.amount),
    }));
    const sent = await shareReminder(`${header}\n${lines.join('\n')}`);
    if (sent) logReminded(scope, others);
  };

  const nothingToDo = transfers.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 rounded-t-sheet" showCloseButton={false}>
        <div className="max-h-[calc(88dvh-2rem)] overflow-y-auto px-5 pb-5 pt-2">
          <DialogTitle className="text-[20px] font-bold leading-[1.2] tracking-[-0.025em] text-foreground">
            {nothingToDo
              ? t('settle.allSquare')
              : t('settle.planTitle', { count: transfers.length, group: groupName })}
          </DialogTitle>

          <p className="mt-1.5 text-[12.5px] font-medium leading-[1.45] text-muted-1">
            {nothingToDo
              ? t(isOneTime ? 'settle.nothingPendingGroup' : 'settle.nothingPending', {
                  month: monthName.toLocaleLowerCase(),
                })
              : t('settle.planSubtitle', {
                  count: transfers.length,
                  expenses: realExpenses.length,
                  month: isOneTime ? groupName : monthName.toLocaleLowerCase(),
                })}
          </p>

          {/* Las tarjetas son la foto del acuerdo: se leen, no se tocan. */}
          {!nothingToDo && (
            <div className="mt-4 space-y-2">
              {transfers.map((transfer, i) => {
                const theyPayYou = transfer.toMemberId === currentMemberId;
                return (
                  <div
                    key={`${transfer.fromMemberId}-${transfer.toMemberId}-${i}`}
                    className="flex items-center gap-2 rounded-card border border-line bg-surface-sunken p-3.5"
                  >
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                      avatarBg(transfer.fromMemberId),
                    )}>
                      {initials(memberName(transfer.fromMemberId))}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden="true" />
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                      avatarBg(transfer.toMemberId),
                    )}>
                      {initials(memberName(transfer.toMemberId))}
                    </span>
                    <div className="ml-1 min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {theyPayYou
                          ? t('settle.theyPayYou', { name: memberName(transfer.fromMemberId) })
                          : transfer.fromMemberId === currentMemberId
                            ? t('settle.youPayThem', { name: memberName(transfer.toMemberId) })
                            : t('settle.theyPayThem', {
                                from: memberName(transfer.fromMemberId),
                                to: memberName(transfer.toMemberId),
                              })}
                      </p>
                      {reasonItems && (
                        <p className="truncate text-[11.5px] font-medium text-muted-2">
                          {t('settle.reason', { items: reasonItems })}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-[14px] font-bold tabular-nums text-foreground">
                      {formatCurrency(transfer.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {!nothingToDo && (
            <>
              {/* El aviso que explica la regla, no un botón gris */}
              <p className="mt-3 rounded-card border border-brand-wash-line bg-brand-wash px-3.5 py-3 text-[11.5px] font-medium leading-[1.5] text-brand-ink">
                {t(isOneTime ? 'settle.planNoticeGroup' : 'settle.planNotice', {
                  month: monthName.toLocaleLowerCase(),
                })}
              </p>

              <div className="mt-4">
                {others.length > 0 && (
                  <button
                    type="button"
                    onClick={notifyEveryone}
                    className="h-12 w-full cursor-pointer rounded-[12px] bg-ink text-[13.5px] font-bold text-paper transition-opacity hover:opacity-90 dark:bg-paper dark:text-ink"
                  >
                    {notifyLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onMarkOneByOne}
                  className="mt-2 h-11 w-full cursor-pointer text-[13px] font-bold text-brand-ink transition-opacity hover:opacity-80"
                >
                  {t('settle.markOneByOne')}
                </button>
              </div>
            </>
          )}

          {/* El nombre del mes queda accesible aunque el título no lo nombre. */}
          <span className="sr-only">{capitalize(isOneTime ? groupName : monthName)}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
