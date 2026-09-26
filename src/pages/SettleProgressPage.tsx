import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowRight, Check, ChevronLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthPager } from '@/components/expenses/MonthPager';
import { avatarBg, initials } from '@/utils/avatar';
import { buildTransferExpense } from '@/utils/transfer';
import { shareReminder } from '@/utils/remind';
import {
  logMarked, logReminded, logUnmarked, readSettleLog, settleScope, type SettleLog,
} from '@/utils/settleLog';
import {
  capitalize, daysSince, formatCurrency, formatDayMonth, formatStamp,
} from '@/utils/format';
import { createExpense, deleteExpense } from '@/api/expenses';
import { useGroup } from '@/hooks/useGroups';
import { useGroupMembers } from '@/hooks/useMembers';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useSettlementActions } from '@/hooks/useSettlementActions';
import type { DebtTransfer, ExpenseResponse } from '@/types/expense';
import { FloatingTopBar, TopBarSpacer } from '@/components/layout/FloatingTopBar';

/**
 * Saldando: cómo va la cosa, pago por pago.
 *
 * Es una pantalla y no una hoja porque saldar lleva días — se marca un pago hoy y el otro el
 * martes — y a algo que dura hay que poder volver. Una hoja se cierra de un manotazo y no deja
 * dónde volver; esta tiene URL, botón de atrás y su propio lugar.
 *
 * Marcar un pago no inventa nada en el backend: anota el movimiento de categoría `prestamo`
 * que mueve el saldo, igual que cargarlo a mano. Cuando no queda ninguno, el mes se cierra solo
 * y la pantalla devuelve a Gastos, donde vive el cierre.
 */
export function SettleProgressPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);

  const { year, month, setYearMonth } = useMonthSearchParams();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const groupTypeKnown = !loadingGroup && group !== undefined;
  const isOneTime = group?.groupType === 'one_time';

  const { data: members = [] } = useGroupMembers(groupId);
  const { data: monthlyData, isLoading, refetch } = useMonthlyBalance(
    groupId, year, month, isOneTime, groupTypeKnown,
  );
  const currentMember = useCurrentMember();
  const { settle } = useSettlementActions({
    groupId, groupName: group?.name ?? '', year, month, isOneTime, groupTypeKnown, refetch,
  });

  const [busy, setBusy] = useState(false);
  const scope = settleScope(groupId, isOneTime, year, month);
  const [log, setLog] = useState<SettleLog>({ marked: {}, reminded: {} });
  useEffect(() => { setLog(readSettleLog(scope)); }, [scope]);

  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const monthName = months[month - 1] ?? '';
  const memberName = (id: number) => members.find(m => m.id === id)?.name ?? '—';

  /* Un evento no tiene meses: arrastrar `?year&month` en su URL sería inventarle uno. */
  const backTo = isOneTime
    ? `/groups/${groupId}`
    : `/groups/${groupId}?year=${year}&month=${month}`;

  const transfers = monthlyData?.transfers ?? [];
  const expenses = monthlyData?.expenses ?? [];
  /* Un pago marcado ES su movimiento: no hay flag "transfer pagado" y no hace falta. */
  const paidMoves = expenses.filter(e => e.category === 'prestamo');
  const total = transfers.length + paidMoves.length;

  /*
    Cerrado el mes, acá no queda nada que hacer: el cierre se lee en Gastos, en su tarjeta de
    tinta. Volver solo evita dejar al usuario mirando una pantalla vacía.
  */
  useEffect(() => {
    if (monthlyData?.isSettled) navigate(backTo, { replace: true });
  }, [monthlyData?.isSettled, backTo, navigate]);

  const markPaid = async (transfer: DebtTransfer) => {
    setBusy(true);
    try {
      const payload = buildTransferExpense(
        transfer, memberName(transfer.fromMemberId), memberName(transfer.toMemberId),
      );
      const { data: created, error } = await createExpense(groupId, payload);
      if (error || !created) { toast.error(error ?? t('toasts.failedSettle')); return; }
      setLog(logMarked(scope, created.id));
      // Con el último pago marcado no queda saldo: cerrar es sólo dejarlo asentado.
      if (transfers.length === 1) await settle();
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const undoPaid = async (move: ExpenseResponse) => {
    setBusy(true);
    try {
      const id = move.parentExpenseId ?? move.id;
      const { success, error } = await deleteExpense(groupId, id);
      if (!success) { toast.error(error ?? t('toasts.failedDelete')); return; }
      setLog(logUnmarked(scope, move.id));
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const remind = async (transfer: DebtTransfer) => {
    const other = transfer.fromMemberId === currentMember?.id
      ? transfer.toMemberId : transfer.fromMemberId;
    const text = t('settle.reminderText', {
      name: memberName(other),
      amount: formatCurrency(transfer.amount),
      group: group?.name ?? '',
      month: isOneTime ? (group?.name ?? '') : monthName.toLocaleLowerCase(),
    });
    if (await shareReminder(text)) setLog(logReminded(scope, [other]));
  };

  /** "Le avisaste hoy" / "Le avisaste hace 2 días" — sólo si el aviso salió de este teléfono. */
  const remindedLine = (memberId: number) => {
    const at = log.reminded[memberId];
    if (!at) return null;
    const days = daysSince(at);
    return days === 0
      ? t('settle.remindedToday')
      : t('settle.remindedAgo', { count: days });
  };

  if (isLoading || !monthlyData) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-3 px-5 py-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-card" />)}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      <FloatingTopBar back={{ to: backTo, label: group?.name ?? t('mobileNav.groups') }} />
      <TopBarSpacer />
      <Link
        to={backTo}
        className="hidden lg:inline-flex items-center gap-0.5 text-[12px] font-semibold text-muted-2 transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {group?.name ?? t('mobileNav.groups')}
      </Link>

      <h1 className="mt-1.5 text-[22px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">
        {/* "Saldando julio", en minúscula: el mes acá es un complemento, no un título. */}
        {t('settle.progressTitle', {
          month: isOneTime ? (group?.name ?? '') : monthName.toLocaleLowerCase(),
        })}
      </h1>

      {!isOneTime && (
        <MonthPager
          className="mt-4"
          year={year}
          month={month}
          onNavigate={setYearMonth}
          isSettled={monthlyData?.isSettled ?? false}
        />
      )}

      <p className="mt-3 text-[12.5px] font-medium text-muted-1">
        {transfers.length === 0
          ? t('settle.allMarked')
          : t('settle.progressCount', { count: transfers.length, total })}
      </p>

      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full bg-positive transition-all"
          style={{ width: `${total > 0 ? (paidMoves.length / total) * 100 : 0}%` }}
        />
      </div>

      {/* ── Lo que ya se marcó ──────────────────────────────────────────────────────── */}
      {paidMoves.length > 0 && (
        <div className="mt-5 space-y-2">
          {paidMoves.map(move => {
            const at = log.marked[move.id];
            return (
              <div
                key={move.id}
                className="flex items-center gap-2.5 rounded-card border border-positive-wash-line bg-positive-wash p-3.5"
              >
                <Check className="h-4 w-4 shrink-0 text-positive" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {/* Sin `capitalize`: la descripción de un pago es "Guada → Fran", y pasarla
                      por ahí le baja la mayúscula al segundo nombre. */}
                  <p className="truncate text-[12.5px] font-bold text-foreground">
                    {move.description}
                  </p>
                  <p className="truncate text-[11.5px] font-medium text-muted-1">
                    {at
                      ? t('settle.markedByYou', {
                          when: formatStamp(at, monthsShort, t('settle.today')),
                        })
                      : t('settle.paidOn', { date: formatDayMonth(move.date, monthsShort) })}
                    {' · '}
                    <span className="tabular-nums">{formatCurrency(move.amount)}</span>
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
            );
          })}
        </div>
      )}

      {/* ── Lo que falta ────────────────────────────────────────────────────────────── */}
      {transfers.length > 0 && (
        <div className="mt-3 space-y-2">
          {transfers.map((transfer, i) => {
            const theyPayYou = transfer.toMemberId === currentMember?.id;
            const involvesYou = theyPayYou || transfer.fromMemberId === currentMember?.id;
            const other = transfer.fromMemberId === currentMember?.id
              ? transfer.toMemberId : transfer.fromMemberId;
            const reminded = remindedLine(other);
            return (
              <div
                key={`${transfer.fromMemberId}-${transfer.toMemberId}-${i}`}
                className="rounded-card border-[1.5px] border-ink bg-surface p-3.5 dark:border-line-strong"
              >
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
                        : transfer.fromMemberId === currentMember?.id
                          ? t('settle.youPayThem', { name: memberName(transfer.toMemberId) })
                          : t('settle.theyPayThem', {
                              from: memberName(transfer.fromMemberId),
                              to: memberName(transfer.toMemberId),
                            })}
                    </p>
                    {reminded && (
                      <p className="truncate text-[11.5px] font-medium text-muted-2">{reminded}</p>
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
                    className="h-9 flex-1 cursor-pointer rounded-pill bg-positive text-[12px] font-bold text-white transition-opacity dark:text-ink hover:opacity-90 disabled:opacity-50"
                  >
                    {theyPayYou
                      ? t('settle.theyPaidMe')
                      : involvesYou
                        ? t('settle.iPaidThem')
                        : t('settle.theyPaidEachOther')}
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
          })}
        </div>
      )}

      {/*
        Todo marcado y el mes todavía abierto. Pasa al reabrir un mes ya saldado: los pagos
        siguen ahí y no hay nada que marcar, así que la única acción que queda es cerrarlo.
      */}
      {transfers.length === 0 && paidMoves.length > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await settle(); } finally { setBusy(false); } }}
          className="mt-3 h-12 w-full cursor-pointer rounded-[12px] bg-primary text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t(isOneTime ? 'settle.closeGroup' : 'settle.closeMonth', { month: monthName.toLocaleLowerCase() })}
        </button>
      )}

      {/* ── Mientras tanto ──────────────────────────────────────────────────────────── */}
      <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
        {t('settle.meanwhile')}
      </p>
      <p className="mt-1.5 text-[12px] font-medium leading-[1.5] text-muted-1">
        {t(isOneTime ? 'settle.progressNoteGroup' : 'settle.progressNote', {
          month: capitalize(monthName),
        })}
      </p>
    </div>
  );
}
