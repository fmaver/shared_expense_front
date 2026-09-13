import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowRight, Check, FileDown, RotateCcw, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { avatarBg, initials } from '@/utils/avatar';
import { buildTransferExpense } from '@/utils/transfer';
import { capitalize, formatCurrency, formatDayMonth } from '@/utils/format';
import { createExpense, deleteExpense } from '@/api/expenses';
import type { DebtTransfer, ExpenseResponse, Member } from '@/types/expense';

interface SettleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  groupName: string;
  month: number;
  members: Member[];
  transfers: DebtTransfer[];
  expenses: ExpenseResponse[];
  isSettled: boolean;
  currentMemberId: number | null;
  /** Cierra el mes cuando ya no queda ningún pago pendiente. */
  onSettle: () => Promise<void>;
  onReopen: () => Promise<void>;
  onExportPdf: () => void;
  onChanged: () => void;
}

/**
 * Saldar no es un botón, es un acuerdo.
 *
 * Tres estados, y el mes va pasando por ellos a medida que la plata se mueve de verdad:
 * el plan (qué pagos faltan), el progreso (cuáles ya se marcaron, con la opción de
 * deshacerlos) y el mes cerrado. Marcar un pago no es un estado aparte: anota el movimiento
 * de categoría `prestamo` en el grupo, igual que hacerlo desde la lista.
 */
export function SettleSheet({
  open, onOpenChange, groupId, groupName, month, members, transfers, expenses,
  isSettled, currentMemberId, onSettle, onReopen, onExportPdf, onChanged,
}: SettleSheetProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const monthName = months[month - 1] ?? '';
  const nextMonthName = months[month % 12] ?? '';
  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? '—';

  /*
    Los pagos ya marcados son los movimientos de categoría `prestamo` del mes. No hay un campo
    "transfer pagado" en el backend y no hace falta: el pago ES el movimiento. La cuenta de
    "faltan 1 de 2" sale de sumar los que quedan pendientes y los que ya se anotaron.
  */
  const paidMoves = expenses.filter(e => e.category === 'prestamo');
  const realExpenses = expenses.filter(e => e.category !== 'prestamo' && e.category !== 'balance');
  const total = transfers.length + paidMoves.length;
  const inProgress = !isSettled && paidMoves.length > 0 && transfers.length > 0;
  /*
    Un mes abierto sin nada pendiente. Pasa al reabrir un mes cuyos pagos ya estaban marcados:
    los movimientos siguen ahí, los saldos están en cero y no hay plan que mostrar. Sin este
    caso el encabezado decía "Con 0 pagos, Casa queda en cero".
  */
  const nothingToDo = !isSettled && transfers.length === 0;

  /** De dónde sale el saldo, dicho como se dice en voz alta: "súper, internet y sofá". */
  const reasonItems = (() => {
    const names = [...new Set(realExpenses.map(e => e.description.toLocaleLowerCase()))].slice(0, 3);
    if (names.length <= 1) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} ${t('groups.and')} ${names[names.length - 1]}`;
  })();

  const movedTotal = paidMoves.reduce((s, e) => s + e.amount, 0);

  const markPaid = async (transfer: DebtTransfer) => {
    setBusy(true);
    try {
      const payload = buildTransferExpense(
        transfer, memberName(transfer.fromMemberId), memberName(transfer.toMemberId),
      );
      const { error } = await createExpense(groupId, payload);
      if (error) { toast.error(error); return; }
      // Con el último pago marcado no queda saldo: cerrar el mes es sólo dejarlo asentado.
      if (transfers.length === 1) await onSettle();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const undoPaid = async (expense: ExpenseResponse) => {
    setBusy(true);
    try {
      const { success, error } = await deleteExpense(groupId, expense.parentExpenseId ?? expense.id);
      if (!success) { toast.error(error ?? t('toasts.failedDelete')); return; }
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  /**
   * Recordar por el canal que la persona ya usa.
   *
   * La hoja nativa de compartir deja elegir WhatsApp, mensajes o lo que tenga; donde no
   * existe, se cae a un link de wa.me con el texto ya escrito. Ninguna de las dos necesita
   * backend — avisar por push es otra cosa y no existe todavía.
   */
  const remind = async (transfer: DebtTransfer) => {
    const other = transfer.fromMemberId === currentMemberId
      ? transfer.toMemberId : transfer.fromMemberId;
    const text = t('settle.reminderText', {
      name: memberName(other),
      amount: formatCurrency(transfer.amount),
      group: groupName,
      month: monthName.toLocaleLowerCase(),
    });
    if (navigator.share) {
      await navigator.share({ text }).catch(() => { /* cancelar no es un error */ });
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const TransferRow = ({ transfer }: { transfer: DebtTransfer }) => {
    const theyPayYou = transfer.toMemberId === currentMemberId;
    return (
      <div className="rounded-card border-[1.5px] border-ink bg-surface p-3.5 dark:border-line-strong">
        <div className="flex items-center gap-2">
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
                : t('settle.youPayThem', { name: memberName(transfer.toMemberId) })}
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

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => markPaid(transfer)}
            className="h-9 flex-1 cursor-pointer rounded-pill bg-positive text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {theyPayYou ? t('settle.theyPaidMe') : t('settle.iPaidThem')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => remind(transfer)}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill border border-line-strong px-3 text-[12px] font-bold text-muted-1 transition-colors hover:bg-surface-sunken"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {t('settle.remind')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 rounded-t-sheet" showCloseButton={false}>
        <div className="max-h-[calc(88dvh-2rem)] overflow-y-auto px-5 pb-5 pt-2">

          {/* ── Estado 3: el mes ya está cerrado ─────────────────────────────────── */}
          {isSettled ? (
            <>
              <div className="rounded-card-lg bg-ink p-5 text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-positive-on-dark/20">
                  <Check className="h-5 w-5 text-positive-on-dark" aria-hidden="true" />
                </span>
                <DialogTitle className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-on-dark">
                  {t('settle.closedTitle', { month: capitalize(monthName) })}
                </DialogTitle>
                <p className="mt-2 font-display text-[30px] leading-none text-positive-on-dark">
                  {t('settle.nobodyOwes')}
                </p>
                <p className="mx-auto mt-3 max-w-[36ch] text-[12px] font-medium leading-[1.5] text-muted-on-dark">
                  {movedTotal > 0
                    ? t('settle.closedNote', {
                        amount: formatCurrency(movedTotal),
                        month: monthName.toLocaleLowerCase(),
                        next: nextMonthName.toLocaleLowerCase(),
                      })
                    : t('settle.closedNoteNoMoney', {
                        month: monthName.toLocaleLowerCase(),
                        next: nextMonthName.toLocaleLowerCase(),
                      })}
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-line-strong text-[13px] font-bold text-foreground transition-colors hover:bg-surface-sunken"
                >
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  {t('settle.pdfOfMonth', { month: monthName.toLocaleLowerCase() })}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => { setBusy(true); try { await onReopen(); } finally { setBusy(false); } }}
                  className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-ink text-[13px] font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-paper dark:text-ink"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t('balance.reopenMonth')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ── Estado 1 y 2: el plan, y el progreso ─────────────────────────── */}
              <DialogTitle className="font-display text-[24px] leading-[1.25] text-foreground">
                {nothingToDo
                  ? t('settle.allSquare')
                  : inProgress
                    ? t('settle.progressTitle', { month: capitalize(monthName) })
                    : t('settle.planTitle', { count: transfers.length, group: groupName })}
              </DialogTitle>

              <p className="mt-1.5 text-[12.5px] font-medium leading-[1.45] text-muted-1">
                {nothingToDo
                  ? t('settle.nothingPending', { month: monthName.toLocaleLowerCase() })
                  : inProgress
                    ? t('settle.progressCount', { count: transfers.length, total })
                    : t('settle.planSubtitle', {
                        count: transfers.length,
                        expenses: realExpenses.length,
                        month: monthName.toLocaleLowerCase(),
                      })}
              </p>

              {inProgress && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-positive transition-all"
                    style={{ width: `${total > 0 ? (paidMoves.length / total) * 100 : 0}%` }}
                  />
                </div>
              )}

              {/* Pagos ya marcados */}
              {paidMoves.length > 0 && (
                <div className="mt-3 space-y-2">
                  {paidMoves.map(move => (
                    <div
                      key={move.id}
                      className="flex items-center gap-2.5 rounded-card border border-positive-wash-line bg-positive-wash p-3"
                    >
                      <Check className="h-4 w-4 shrink-0 text-positive" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold text-foreground">
                          {capitalize(move.description)}
                        </p>
                        <p className="text-[11.5px] font-medium text-muted-1">
                          {t('settle.paidOn', { date: formatDayMonth(move.date, monthsShort) })}
                          {' · '}{formatCurrency(move.amount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => undoPaid(move)}
                        className="shrink-0 cursor-pointer text-[12px] font-bold text-brand-ink hover:underline disabled:opacity-50"
                      >
                        {t('settle.undo')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagos pendientes */}
              {transfers.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {transfers.map((transfer, i) => (
                    <TransferRow key={`${transfer.fromMemberId}-${transfer.toMemberId}-${i}`} transfer={transfer} />
                  ))}
                </div>
              ) : null}

              {/* El aviso que explica la regla, no un botón gris */}
              {!nothingToDo && (
                <p className="mt-3 rounded-card border border-brand-wash-line bg-brand-wash px-3.5 py-3 text-[11.5px] font-medium leading-[1.5] text-brand-ink">
                  {inProgress
                    ? t('settle.progressNote', { month: capitalize(monthName) })
                    : t('settle.planNotice', { month: monthName.toLocaleLowerCase() })}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
