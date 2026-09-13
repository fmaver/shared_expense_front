import React, { useRef, useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { capitalize, formatDayMonth } from '@/utils/format';
import { useCategories } from '@/hooks/useCategories';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTranslation } from 'react-i18next';
import type { ExpenseResponse, Member } from '@/types/expense';
import { ExpenseDetailDialog } from './ExpenseDetailDialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { avatarBg, initials } from '@/utils/avatar';
import { computeSplit, isOutsider, netOf } from '@/utils/split';

// Las categorías internas no las devuelve la API — sus emojis viven acá.
const INTERNAL_EMOJI: Record<string, string> = {
  balance: '⚖️',
  prestamo: '🤝',
};

type BadgeTone = 'fixed' | 'credit' | 'usd' | 'split';

const BADGE_TONE: Record<BadgeTone, string> = {
  fixed:  'bg-brand-wash text-brand-ink',
  credit: 'bg-tag-credit-wash text-tag-credit',
  usd:    'bg-tag-usd-wash text-tag-usd',
  split:  'bg-tag-split-wash text-tag-split',
};

/**
 * Badge de excepción.
 *
 * Sólo aparece cuando el gasto se sale de lo normal. Un gasto en débito, en partes iguales y
 * en pesos no lleva ninguno: etiquetar lo esperable es ruido (principio 2 del handoff).
 */
function ExceptionBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-chip px-1.5 py-0.5',
        'text-[10.5px] font-bold leading-[1.4]',
        BADGE_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

interface ExpenseRowProps {
  expense: ExpenseResponse;
  members: Member[];
  isSettled: boolean;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  highlight?: boolean;
  hideSplitBadge?: boolean;
  hideActions?: boolean;
  groupId?: number;
  groupName?: string;
  /** Un grupo de evento no tiene meses ni cuotas; el detalle lo aclara al pie. */
  isOneTimeGroup?: boolean;
  viewedYear?: number;
  viewedMonth?: number;
  /**
   * Qué se dibuja a la izquierda. En un grupo importa quién pagó, así que va su avatar; en la
   * lista personal pagaste siempre vos, así que el lugar lo ocupa la categoría (§6.4).
   */
  variant?: 'payer' | 'category';
  /** Open this row's detail on mount — used when a push notification deep-links to it. */
  autoOpenDetail?: boolean;
  onRecurringDelete?: (templateId: number) => void;
  onRecurringEdit?: (expense: ExpenseResponse) => void;
}

function memberName(members: Member[], id: number) {
  return members.find(m => m.id === id)?.name ?? 'Unknown';
}

export function ExpenseRow({
  expense, members, isSettled, onEdit, onDelete,
  highlight = false, hideSplitBadge = false, hideActions = false,
  groupId, groupName, isOneTimeGroup = false, viewedYear, viewedMonth,
  variant = 'payer', autoOpenDetail = false,
  onRecurringDelete, onRecurringEdit,
}: ExpenseRowProps) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const { formatAmount } = useCurrency();
  const currentMember = useCurrentMember();
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  const categoryEmoji = categories.find(c => c.name === expense.category)?.emoji
    ?? INTERNAL_EMOJI[expense.category];
  const rowRef = useRef<HTMLDivElement>(null);
  const [isFlashing, setIsFlashing] = useState(highlight);
  const [detailOpen, setDetailOpen] = useState(false);

  // A push notification links straight to one expense; opening its detail is the difference
  // between arriving at the thing and arriving near it.
  useEffect(() => {
    if (autoOpenDetail) setDetailOpen(true);
  }, [autoOpenDetail]);

  useEffect(() => {
    if (!highlight) return;
    rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setIsFlashing(false), 2000);
    return () => clearTimeout(timer);
  }, [highlight]);

  const split = computeSplit(expense, members);
  const isRecurring = expense.recurringTemplateId != null;
  const hasInstallments = expense.paymentType === 'credit' && expense.installments > 1;
  const isUsd = (expense.currency ?? 'ARS') === 'USD';
  const showSplitInfo = !hideSplitBadge && variant === 'payer';
  const unevenSplit = showSplitInfo && !split.isEven;

  /* ── Metadato: quién pagó · cómo se dividió (si no es lo normal) · cuándo ─────────── */
  const meta: string[] = [];
  if (variant === 'payer') {
    meta.push(
      currentMember && expense.payerId === currentMember.id
        ? t('expenses.paidByYou')
        : t('expenses.paidBy', { name: memberName(members, expense.payerId) }),
    );
  }
  if (unevenSplit) {
    if (expense.splitStrategy.type === 'equal') {
      meta.push(t('expenses.metaEqualAmong', { count: split.participantIds.length }));
    } else if (expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages) {
      // "40/30/30" dice más que la palabra "porcentajes" y entra en el mismo espacio.
      meta.push(
        Object.values(expense.splitStrategy.percentages)
          .map(p => Math.round(p ?? 0))
          .join('/'),
      );
    } else {
      meta.push(t('expenses.metaExact'));
    }
  }
  meta.push(formatDayMonth(expense.date, monthsShort));

  /* ── Tu parte: la única cifra de la fila que habla de vos ─────────────────────────── */
  const net = currentMember ? netOf(expense, split, currentMember.id) : 0;
  const outsider = currentMember ? isOutsider(expense, split, currentMember.id) : false;
  let yourPart: { text: string; tone: string } | null = null;
  if (currentMember && variant === 'payer') {
    if (outsider) {
      yourPart = { text: t('expenses.notInvolved'), tone: 'text-muted-2 font-medium' };
    } else if (net > 0.01) {
      yourPart = {
        text: t('expenses.theyOweYou', { amount: formatAmount(net, expense.currency) }),
        tone: 'text-positive',
      };
    } else if (net < -0.01) {
      yourPart = {
        text: t('expenses.youOwe', { amount: formatAmount(-net, expense.currency) }),
        tone: 'text-negative',
      };
    }
  }

  return (
    <>
      <div
        ref={rowRef}
        onClick={() => setDetailOpen(true)}
        className={cn(
          'flex cursor-pointer touch-manipulation items-center gap-3 px-5 py-3 transition-colors',
          'border-b border-line last:border-b-0',
          '[@media(hover:hover)]:hover:bg-brand-wash active:bg-brand-wash',
          // La fila abierta queda marcada mientras el panel se lee al costado (sólo desktop:
          // en mobile la hoja tapa la lista, así que no hay nada que señalar).
          detailOpen && 'lg:bg-brand-wash',
          isFlashing && 'bg-brand-wash',
        )}
      >
        {variant === 'payer' ? (
          <div
            className={cn(
              'flex h-[34px] w-[34px] shrink-0 select-none items-center justify-center rounded-full',
              'text-[12px] font-bold text-white',
              avatarBg(expense.payerId),
            )}
            aria-hidden="true"
          >
            {initials(memberName(members, expense.payerId))}
          </div>
        ) : (
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken">
            {categoryEmoji
              ? <span className="text-lg leading-none">{categoryEmoji}</span>
              : <span className="text-[11px] font-bold uppercase text-muted-2">{expense.category.slice(0, 2)}</span>}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
              {capitalize(expense.description)}
            </p>
            {/* El ícono de repetición se conserva (checklist §7), adentro del badge, porque
                la palabra "recurrente" sale del copy de cara al usuario (§6.2). */}
            {isRecurring && (
              <ExceptionBadge tone="fixed">
                <Repeat className="h-2.5 w-2.5" aria-hidden="true" />
                {t('expenses.badgeFixed')}
              </ExceptionBadge>
            )}
            {hasInstallments && (
              <ExceptionBadge tone="credit">
                {expense.installmentNo}/{expense.installments}
              </ExceptionBadge>
            )}
            {isUsd && <ExceptionBadge tone="usd">USD</ExceptionBadge>}
            {unevenSplit && <ExceptionBadge tone="split">{t('expenses.badgeSplit')}</ExceptionBadge>}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] font-medium leading-tight text-muted-2">
            {meta.join(' · ')}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[13.5px] font-bold leading-tight tabular-nums text-foreground">
            {formatAmount(expense.amount, expense.currency)}
          </p>
          {yourPart && (
            <p className={cn('mt-0.5 text-[11.5px] font-semibold leading-tight tabular-nums', yourPart.tone)}>
              {yourPart.text}
            </p>
          )}
        </div>
      </div>

      <ExpenseDetailDialog
        expense={expense}
        members={members}
        isSettled={isSettled}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        hideSplitBadge={hideSplitBadge}
        hideActions={hideActions}
        groupId={groupId}
        groupName={groupName}
        isOneTimeGroup={isOneTimeGroup}
        viewedYear={viewedYear}
        viewedMonth={viewedMonth}
        onRecurringDelete={onRecurringDelete}
        onRecurringEdit={onRecurringEdit}
      />
    </>
  );
}
