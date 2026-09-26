import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  capitalize, firstInstallmentDate, formatWeekdayDayMonth,
} from '@/utils/format';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { avatarBg, initials } from '@/utils/avatar';
import { computeSplit, netOf, shareOf } from '@/utils/split';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ExpenseResponse, Member } from '@/types/expense';

/** Las categorías internas son símbolos, no palabras: van con su emoji y no con iniciales. */
const INTERNAL_EMOJI: Record<string, string> = {
  balance: '⚖️',
  prestamo: '🤝',
};

/** A partir de cuántos participantes el reparto se pliega (§6.5). */
const FOLD_THRESHOLD = 4;

interface ExpenseDetailDialogProps {
  expense: ExpenseResponse;
  members: Member[];
  isSettled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  hideSplitBadge?: boolean;
  hideActions?: boolean;
  groupId?: number;
  groupName?: string;
  isOneTimeGroup?: boolean;
  viewedYear?: number;
  viewedMonth?: number;
  onRecurringDelete?: (templateId: number) => void;
  onRecurringEdit?: (expense: ExpenseResponse) => void;
}

function memberName(members: Member[], id: number) {
  return members.find(m => m.id === id)?.name ?? 'Unknown';
}

/** Celda de dato: label chico arriba, valor firme abajo. Nunca pares label-valor en prosa. */
function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 rounded-[12px] border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-2">{label}</p>
      <p className="mt-1 truncate text-[12.5px] font-bold text-foreground">{value}</p>
    </div>
  );
}

/** Caja de cifra del bloque oscuro. */
function DarkBox({
  label, value, tone = 'neutral',
}: { label: string; value: string; tone?: 'neutral' | 'positive' | 'negative' }) {
  return (
    <div
      className={cn(
        'min-w-0 flex-1 rounded-[14px] px-3.5 py-3',
        tone === 'neutral' && 'bg-white/[0.07]',
        tone === 'positive' && 'bg-positive-on-dark/[0.14]',
        tone === 'negative' && 'bg-negative-on-dark/[0.16]',
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-on-dark">{label}</p>
      <p
        className={cn(
          'mt-1 truncate text-[21px] font-bold leading-none tracking-[-0.03em] tabular-nums',
          tone === 'neutral' && 'text-paper',
          tone === 'positive' && 'text-positive-on-dark',
          tone === 'negative' && 'text-negative-on-dark',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ExpenseDetailDialog({
  expense, members, isSettled, open, onOpenChange, onEdit, onDelete,
  hideSplitBadge = false, hideActions = false,
  groupId, groupName, isOneTimeGroup = false,
  onRecurringDelete, onRecurringEdit,
}: ExpenseDetailDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const currentMember = useCurrentMember();
  const [expandedSplit, setExpandedSplit] = useState(false);

  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const weekdaysShort = t('weekdaysShort', { returnObjects: true }) as string[];

  const canEdit = expense.installmentNo === 1;
  const hasInstallments = expense.paymentType === 'credit' && expense.installments > 1;
  const split = computeSplit(expense, members);
  const categoryLabel = capitalize(
    t(`categories.${expense.category}`, { defaultValue: expense.category }),
  );

  const subtitle = [
    categoryLabel,
    formatWeekdayDayMonth(expense.date, monthsShort, weekdaysShort),
    groupName,
  ].filter(Boolean).join(' · ');

  /* ── Tu posición en este gasto ────────────────────────────────────────────────────── */
  const net = currentMember ? netOf(expense, split, currentMember.id) : 0;
  const showYourBox = currentMember != null && Math.abs(net) > 0.01;
  const yourShare = currentMember ? shareOf(split, currentMember.id) : 0;

  /* ── Reparto, con plegado para grupos grandes ─────────────────────────────────────── */
  /*
    Cada fila dice la **posición neta** de esa persona en el gasto, no su parte: quien puso la
    plata aparece con lo que le deben (`+$840.000`) y el resto con lo que debe (`−$120.000`).
    La parte de cada uno se dice una sola vez, en el encabezado de la tarjeta.

    El pagador entra aunque no participe del reparto: puso la plata, así que tiene posición.
  */
  const splitMemberIds = [...new Set([expense.payerId, ...split.participantIds])];
  const splitRows = splitMemberIds.map(id => ({
    id,
    name: id === currentMember?.id ? t('expenseDetail.splitYou') : memberName(members, id),
    amount: shareOf(split, id),
    net: netOf(expense, split, id),
  }));

  const splitTitle = (() => {
    if (expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages) {
      return Object.values(expense.splitStrategy.percentages)
        .map(p => Math.round(p ?? 0))
        .join('/');
    }
    if (expense.splitStrategy.type === 'exact') return t('expenseDetail.splitExact');
    return t('expenseDetail.splitEqual');
  })();

  /** Cuánto le tocó a cada uno, cuando a todos les tocó lo mismo. */
  const evenShare = (() => {
    const shares = split.participantIds.map(id => shareOf(split, id));
    if (shares.length === 0) return null;
    return shares.every(v => Math.abs(v - shares[0]) < 0.01) ? shares[0] : null;
  })();

  const shouldFold = splitRows.length > FOLD_THRESHOLD && !expandedSplit;
  // Se muestran siempre los extremos: vos, quien pagó y quien más debe. El resto se pliega.
  const anchorIds = new Set<number>();
  if (shouldFold) {
    if (currentMember) anchorIds.add(currentMember.id);
    anchorIds.add(expense.payerId);
    const biggest = [...splitRows].sort((a, b) => a.net - b.net)[0];
    if (biggest) anchorIds.add(biggest.id);
  }
  const shownRows = shouldFold ? splitRows.filter(r => anchorIds.has(r.id)) : splitRows;
  const foldedRows = shouldFold ? splitRows.filter(r => !anchorIds.has(r.id)) : [];
  const foldedAreEqual = foldedRows.length > 0
    && foldedRows.every(r => Math.abs(r.net - foldedRows[0].net) < 0.01);

  /* ── Acciones ─────────────────────────────────────────────────────────────────────── */
  const handleEdit = () => {
    if (!canEdit) return;
    onOpenChange(false);
    if (expense.recurringTemplateId != null && onRecurringEdit) onRecurringEdit(expense);
    else onEdit(expense);
  };

  const handleDelete = () => {
    if (!canEdit) return;
    onOpenChange(false);
    if (expense.recurringTemplateId != null && onRecurringDelete) {
      onRecurringDelete(expense.recurringTemplateId);
    } else {
      onDelete(expense);
    }
  };

  /**
   * Ir a la cuota 1, que es donde el gasto se edita.
   *
   * Las cuotas son una fila por mes, así que la primera vive en otro mes: el link lleva el
   * año y el mes calculados, y el id del gasto padre para que su detalle se abra solo.
   */
  const firstInstallmentHref = (() => {
    if (canEdit || groupId == null) return null;
    const target = expense.parentExpenseId ?? expense.id;
    const date = firstInstallmentDate(expense.date, expense.installmentNo);
    const params = new URLSearchParams({
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1),
      expense: String(target),
      highlight: String(target),
    });
    return `/groups/${groupId}?${params}`;
  })();

  const showActions = !isSettled && !hideActions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="panel"
        showCloseButton={false}
        className="gap-0 overflow-hidden bg-ink p-0 rounded-t-sheet"
      >
        {/* ── Bloque oscuro ──────────────────────────────────────────────────────────── */}
        <div className="relative bg-ink px-5 pb-5 pt-4 lg:pt-5">
          <DialogClose
            render={
              <button
                type="button"
                aria-label={t('expenseDetail.close')}
                className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-paper/50 outline-none transition-colors hover:bg-white/10 hover:text-paper focus-visible:ring-2 focus-visible:ring-brand-soft"
              />
            }
          >
            <X className="h-4 w-4" />
          </DialogClose>

          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-[13px] font-bold uppercase text-brand-soft">
              {INTERNAL_EMOJI[expense.category]
                ? <span className="text-xl leading-none">{INTERNAL_EMOJI[expense.category]}</span>
                : categoryLabel.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-[15px] font-bold leading-tight text-paper">
                {capitalize(expense.description)}
              </DialogTitle>
              <p className="mt-1 truncate text-[11.5px] font-medium text-muted-on-dark">
                {subtitle}
              </p>
            </div>
            {hasInstallments && (
              <span className="shrink-0 rounded-chip border border-brand-soft/40 px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand-soft">
                {expense.installmentNo}/{expense.installments}
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <DarkBox
              label={hasInstallments
                ? t('expenseDetail.thisInstallment')
                : isOneTimeGroup ? t('expenseDetail.expenseBox') : t('expenseDetail.amount')}
              value={formatAmount(expense.amount, expense.currency)}
            />
            {/*
              En un evento la pregunta no es "cuánto te deben" sino "cuánto me tocó": el saldo
              corre hasta que cierren el grupo, así que lo accionable es tu parte.
            */}
            {isOneTimeGroup ? (
              yourShare > 0.01 && (
                <DarkBox
                  label={t('expenseDetail.yourPartBox')}
                  value={formatAmount(yourShare, expense.currency)}
                />
              )
            ) : showYourBox && (
              <DarkBox
                label={net > 0 ? t('expenseDetail.theyOwe') : t('expenseDetail.youOwe')}
                value={formatAmount(Math.abs(net), expense.currency)}
                tone={net > 0 ? 'positive' : 'negative'}
              />
            )}
          </div>
        </div>

        {/* ── Cuerpo claro ───────────────────────────────────────────────────────────── */}
        <div className="space-y-3 bg-background px-5 pb-5 pt-4">
          <div className="flex gap-2">
            <Cell label={t('expenseDetail.cellPayer')} value={memberName(members, expense.payerId)} />
            <Cell
              label={t('expenseDetail.cellMethod')}
              value={
                hasInstallments
                  ? `${t('expenseDetail.methodCredit')} ${expense.installmentNo}/${expense.installments}`
                  : t(expense.paymentType === 'credit' ? 'expenseDetail.methodCredit' : 'expenseDetail.methodDebit')
              }
            />
            {hasInstallments ? (
              <Cell
                label={t('expenseDetail.cellTotal')}
                value={formatAmount(expense.amount * expense.installments, expense.currency)}
              />
            ) : (
              <Cell
                label={t('expenseDetail.cellStatus')}
                value={t(isSettled ? 'expenseDetail.statusSettled' : 'expenseDetail.statusOpen')}
              />
            )}
          </div>

          {/* Reparto */}
          {!hideSplitBadge && splitRows.length > 0 && (
            <div className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-bold text-foreground">{splitTitle}</p>
                <p className="shrink-0 text-[11.5px] font-medium text-muted-2">
                  {evenShare != null
                    ? t('expenseDetail.splitCountEach', {
                        count: split.participantIds.length,
                        amount: formatAmount(evenShare, expense.currency),
                      })
                    : t('expenseDetail.splitCount', { count: split.participantIds.length })}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {shownRows.map(row => (
                  <div key={row.id} className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex h-[26px] w-[26px] shrink-0 select-none items-center justify-center rounded-full text-[10px] font-bold text-white',
                        avatarBg(row.id),
                      )}
                      aria-hidden="true"
                    >
                      {initials(memberName(members, row.id))}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
                      {row.name}
                      {row.id === expense.payerId && (
                        <span className="text-muted-2"> · {t('expenseDetail.putItIn')}</span>
                      )}
                    </span>
                    <span className={cn(
                      'shrink-0 text-[12.5px] font-bold tabular-nums',
                      Math.abs(row.net) <= 0.01 ? 'text-muted-2'
                        : row.net > 0 ? 'text-positive' : 'text-negative',
                    )}>
                      {row.net > 0 ? '+' : row.net < 0 ? '−' : ''}
                      {formatAmount(Math.abs(row.net), expense.currency)}
                    </span>
                  </div>
                ))}

                {foldedRows.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex shrink-0 items-center" aria-hidden="true">
                      {foldedRows.slice(0, 3).map((row, i) => (
                        <div
                          key={row.id}
                          className={cn(
                            'flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white',
                            avatarBg(row.id),
                            i > 0 && '-ml-[9px]',
                          )}
                        >
                          {initials(memberName(members, row.id))}
                        </div>
                      ))}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-muted-2">
                      {foldedAreEqual
                        ? t('expenseDetail.foldedEven', {
                            count: foldedRows.length,
                            amount: formatAmount(Math.abs(foldedRows[0].net), expense.currency),
                          })
                        : t('expenseDetail.folded', { count: foldedRows.length })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedSplit(true)}
                      className="shrink-0 cursor-pointer text-[12px] font-bold text-brand-ink hover:underline"
                    >
                      {t('expenseDetail.seeAll')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones — dos botones de igual ancho */}
          {showActions && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={!canEdit}
                  className={cn(
                    'h-11 flex-1 rounded-[12px] text-[13px] font-bold transition-colors',
                    canEdit
                      ? 'cursor-pointer bg-ink text-paper hover:bg-ink/90 dark:bg-paper dark:text-ink dark:hover:bg-paper/90'
                      : 'cursor-default bg-surface-sunken text-muted-3',
                  )}
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canEdit}
                  className={cn(
                    'h-11 flex-1 rounded-[12px] border text-[13px] font-bold transition-colors',
                    canEdit
                      ? 'cursor-pointer border-negative-wash-line bg-negative-wash text-negative hover:bg-negative-wash/70'
                      : 'cursor-default border-transparent bg-surface-sunken text-muted-3',
                  )}
                >
                  {t('expenseDetail.delete')}
                </button>
              </div>

              {/* La regla se explica en palabras, no con un botón gris y un `title` (principio 4) */}
              {!canEdit && (
                <p className="flex items-start gap-1.5 text-[11px] font-medium leading-[1.45] text-muted-1">
                  <AlertCircle className="mt-px h-3 w-3 shrink-0 text-muted-2" aria-hidden="true" />
                  <span>
                    {t('expenseDetail.installmentLock', { no: expense.installmentNo })}
                    {firstInstallmentHref && (
                      <>
                        {' — '}
                        <button
                          type="button"
                          onClick={() => { onOpenChange(false); navigate(firstInstallmentHref); }}
                          className="cursor-pointer font-bold text-brand-ink hover:underline"
                        >
                          {t('expenseDetail.goToFirst')}
                        </button>
                      </>
                    )}
                  </span>
                </p>
              )}
            </div>
          )}

          {isOneTimeGroup && groupName && (
            <p className="text-[11px] font-medium leading-[1.45] text-muted-2">
              {t('expenseDetail.eventFootnote', { group: groupName })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
