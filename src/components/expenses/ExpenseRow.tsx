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
import { computeSplit, isOutsider, netOf } from '@/utils/split';
import { FALLBACK_EMOJI, Highlighted } from '@/components/search/SearchResultRow';
import { baseDescription } from '@/utils/search';

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
  /** El detalle se abre en sólo lectura (grupo archivado). */
  readOnly?: boolean;
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
  /** Texto de la lupa del mes (V8.c): mientras hay texto, resalta la coincidencia en el título. */
  query?: string;
}

function memberName(members: Member[], id: number) {
  return members.find(m => m.id === id)?.name ?? 'Unknown';
}

export function ExpenseRow({
  expense, members, isSettled, onEdit, onDelete,
  highlight = false, hideSplitBadge = false, hideActions = false, readOnly = false,
  groupId, groupName, isOneTimeGroup = false, viewedYear, viewedMonth,
  variant = 'payer', autoOpenDetail = false,
  onRecurringDelete, onRecurringEdit, query,
}: ExpenseRowProps) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const { formatAmount, blueRate, displayMode } = useCurrency();
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

  // La cuota ya la dice su badge ("4/9"): el " (4/9)" que trae la descripción la repetía.
  const displayTitle = expense.category in INTERNAL_EMOJI ? expense.description : capitalize(baseDescription(expense.description));
  const split = computeSplit(expense, members);
  const isRecurring = expense.recurringTemplateId != null;
  const hasInstallments = expense.paymentType === 'credit' && expense.installments > 1;
  const isUsd = (expense.currency ?? 'ARS') === 'USD';
  const showSplitInfo = !hideSplitBadge && variant === 'payer';
  const unevenSplit = showSplitInfo && !split.isEven;

  const percentageLabel = expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages
    ? Object.values(expense.splitStrategy.percentages).map(p => Math.round(p ?? 0)).join('/')
    : '';

  /*
    Metadato: quién pagó, y **un** calificador — el que más dice de este gasto.
    La fecha ya la pone el encabezado del día, y el porcentaje ya lo dice su badge, así que
    repetirlos acá sería llenar la línea con lo que el ojo ya leyó.
  */
  const meta: string[] = [];
  if (variant === 'payer') {
    meta.push(
      currentMember && expense.payerId === currentMember.id
        ? t('expenses.paidByYou')
        : t('expenses.paidBy', { name: memberName(members, expense.payerId) }),
    );
  }
  const qualifier = (() => {
    if (isUsd && displayMode === 'ars' && blueRate) {
      return t('expenses.metaAtBlue', { rate: blueRate.toLocaleString('es-AR') });
    }
    if (hasInstallments) return t('expenses.metaCredit');
    // La lista personal es de una sola persona: "iguales entre 1" no dice nada.
    if (variant === 'category') return '';
    if (expense.splitStrategy.type === 'exact') return t('expenses.metaExactSplit');
    if (expense.splitStrategy.type === 'percentage') return '';
    return split.isEven
      ? t('expenses.metaEqualAll', { count: split.participantIds.length })
      : t('expenses.metaEqualSome', { count: split.participantIds.length });
  })();
  if (qualifier) meta.push(qualifier);
  // En la lista personal no hay pagador ni división: ahí la fecha sigue siendo el dato.
  if (variant === 'category') meta.push(formatDayMonth(expense.date, monthsShort));

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
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] bg-surface-sunken">
          {/* Ruling 3: sin emoji conocido va 🧾, nunca iniciales. */}
          <span className="text-[19px] leading-none">{categoryEmoji || FALLBACK_EMOJI}</span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Las categorías internas traen su descripción ya armada ("Guada → Fran"), y
              `capitalize` le bajaría la mayúscula al segundo nombre. */}
          <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
            {query
              ? <Highlighted text={displayTitle} query={query} />
              : displayTitle}
          </p>
          {/* Los badges van en la segunda línea, delante del metadato: al lado del título, dos
              badges (cada mes + 50/30/20) se comían la descripción entera en mobile. La
              descripción es lo que se busca con el ojo; el metadato es lo que puede cortarse. */}
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            {/* El ícono de repetición se conserva (checklist §7), adentro del badge, porque
                la palabra "recurrente" sale del copy de cara al usuario (§6.2). */}
            {isRecurring && (
              <ExceptionBadge tone="fixed">
                <Repeat className="h-2.5 w-2.5" aria-hidden="true" />
                {t('expenses.badgeRecurring2')}
              </ExceptionBadge>
            )}
            {hasInstallments && (
              <ExceptionBadge tone="credit">
                {expense.installmentNo}/{expense.installments}
              </ExceptionBadge>
            )}
            {/* El badge con el monto original sólo cuando la cifra grande está pasada a pesos;
                viéndose en USD, decir "USD 120" al lado de "US$120" es decirlo dos veces. */}
            {isUsd && displayMode === 'ars' && (
              <ExceptionBadge tone="usd">
                USD {Math.round(expense.amount).toLocaleString('es-AR')}
              </ExceptionBadge>
            )}
            {unevenSplit && expense.splitStrategy.type === 'percentage' && (
              <ExceptionBadge tone="split">{percentageLabel}</ExceptionBadge>
            )}
            {unevenSplit && expense.splitStrategy.type === 'exact' && (
              <ExceptionBadge tone="split">{t('expenses.badgeExact')}</ExceptionBadge>
            )}
            <p className="min-w-0 truncate text-[11.5px] font-medium leading-tight text-muted-2">
              {meta.join(' · ')}
            </p>
          </div>
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
        categoryEmoji={categoryEmoji}
        members={members}
        isSettled={isSettled}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        hideSplitBadge={hideSplitBadge}
        hideActions={hideActions}
        readOnly={readOnly}
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
