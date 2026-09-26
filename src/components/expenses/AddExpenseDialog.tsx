import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Segmented } from '@/components/ui/Segmented';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { createRecurringGroupExpense } from '@/api/recurringExpenses';
import {
  formatDate, formatDayMonth, formatKeypadAmount, parseKeypadAmount,
} from '@/utils/format';
import { avatarBg, initials } from '@/utils/avatar';
import { AmountInput } from './AmountInput';
import { FromPhotoPill, ReceiptRow, ScanReading, ScanReviewNotice } from './ScanReview';
import { draftFields, useReceiptScan } from '@/hooks/useReceiptScan';
import { FEATURE_RECEIPTS } from '@/config/features';
import { CategoryChips } from './CategoryChips';
import { ContextCard, ContextRow } from './ContextRows';
import { DatePicker, PaymentPicker } from './ContextPickers';
import type { ExpenseCreate, ExpenseResponse, Member, SplitStrategy } from '@/types/expense';

/** Qué se está cargando. Un préstamo es un gasto con otra categoría y otro reparto. */
type Mode = 'expense' | 'loan';
/** Qué selector está abierto encima de la hoja. */
type Picker = null | 'payer' | 'split' | 'date' | 'payment' | 'loanTarget';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: ExpenseCreate) => void;
  members: Member[];
  initialExpense?: ExpenseResponse;
  isSettled?: boolean;
  hidePayerAndSplit?: boolean;
  currentMemberId?: number | null;
  groupId?: number;
  onSuccess?: () => void;
  isRecurringEdit?: boolean;
  /** One-time groups reject credit server-side; hide the control so it is never offered. */
  isOneTimeGroup?: boolean;
  /** Con qué pestaña abre. `loan` es el viejo "Transferencia": un pago entre dos personas. */
  initialMode?: Mode;
  /**
   * Una foto de ticket elegida desde el "+" (V6.6): la hoja abre leyéndola y después muestra
   * el formulario completado para revisar.
   */
  scanFile?: File | null;
}

interface FormState {
  amountText: string;
  description: string;
  date: string;
  category: string;
  payerId: number;
  paymentType: 'debit' | 'credit';
  installments: number;
  currency: string;
  splitStrategy: SplitStrategy;
  loanTargetId: number | null;
}

function buildInitial(
  initialExpense: ExpenseResponse | undefined,
  members: Member[],
  firstCategory: string,
  currentMemberId?: number | null,
): FormState {
  const defaultPayerId = (currentMemberId && members.some(m => m.id === currentMemberId))
    ? currentMemberId
    : (members[0]?.id ?? 0);

  if (initialExpense) {
    // Una cuota muestra su parte; el formulario edita el gasto entero, así que se re-multiplica.
    const amount = initialExpense.paymentType === 'credit' && initialExpense.installments > 1
      ? initialExpense.amount * initialExpense.installments
      : initialExpense.amount;
    return {
      amountText: formatKeypadAmount(amount),
      // El "(3/6)" del título lo agrega el backend al expandir las cuotas; no se re-edita.
      description: initialExpense.description.replace(/\s*\(\d+\/\d+\)\s*$/, ''),
      date: initialExpense.date,
      category: initialExpense.category,
      payerId: initialExpense.payerId,
      paymentType: initialExpense.paymentType,
      installments: initialExpense.installments,
      currency: initialExpense.currency ?? 'ARS',
      splitStrategy: {
        type: initialExpense.splitStrategy.type,
        ...(initialExpense.splitStrategy.type === 'percentage'
          ? { percentages: initialExpense.splitStrategy.percentages } : {}),
        ...(initialExpense.splitStrategy.type === 'exact'
          ? { amounts: initialExpense.splitStrategy.amounts } : {}),
        ...(initialExpense.splitStrategy.participantIds != null
          ? { participantIds: initialExpense.splitStrategy.participantIds } : {}),
      },
      loanTargetId: null,
    };
  }

  return {
    amountText: '',
    description: '',
    date: formatDate(new Date()),
    category: firstCategory,
    payerId: defaultPayerId,
    paymentType: 'debit',
    installments: 1,
    currency: 'ARS',
    splitStrategy: { type: 'equal' },
    loanTargetId: null,
  };
}

export function AddExpenseDialog({
  open, onOpenChange, onSubmit, members, initialExpense, isSettled = false,
  hidePayerAndSplit = false, currentMemberId, groupId, onSuccess,
  isRecurringEdit = false, isOneTimeGroup = false, initialMode = 'expense', scanFile = null,
}: AddExpenseDialogProps) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const { blueRate } = useCurrency();

  const isEdit = !!initialExpense;
  const isLoanEdit = isEdit && initialExpense?.category === 'prestamo';
  const disabled = isSettled;

  const [form, setForm] = useState<FormState>(() =>
    buildInitial(initialExpense, members, categories[0]?.name ?? '', currentMemberId));
  const [mode, setMode] = useState<Mode>(isLoanEdit ? 'loan' : initialMode);
  const [picker, setPicker] = useState<Picker>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scan = useReceiptScan(groupId);

  useEffect(() => {
    if (!open) return;
    setForm(buildInitial(initialExpense, members, categories[0]?.name ?? '', currentMemberId));
    setMode(initialExpense?.category === 'prestamo' ? 'loan' : initialMode);
    setPicker(null);
    setIsRecurring(false);
    setError('');
    scan.reset();
    if (scanFile) scanImage(scanFile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /*
    Las categorías llegan por red. Si la hoja se abre antes de que lleguen, el estado inicial
    queda sin categoría y el guardado se traba en una validación que el usuario no ve venir:
    los chips no muestran ninguna elegida y el botón parece no hacer nada. En cuanto llegan,
    se elige la primera.
  */
  useEffect(() => {
    if (open && mode === 'expense' && !form.category && categories.length > 0) {
      setForm(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [open, mode, form.category, categories]);

  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  const amount = parseKeypadAmount(form.amountText);
  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const memberName = (id: number | null) => members.find(m => m.id === id)?.name ?? '';

  const exactTotal = useMemo(() => Object.values(form.splitStrategy.amounts ?? {})
    .reduce<number>((s, v) => s + (v ?? 0), 0), [form.splitStrategy]);
  const exactRemaining = amount - exactTotal;

  /* ── Escaneo de ticket ────────────────────────────────────────────────────────────── */
  const scanImage = async (file: File) => {
    if (groupId == null || scan.scanning) return;
    setError('');
    try {
      await scan.scan(file, draft => {
        set({
          ...(draft.amount != null ? { amountText: formatKeypadAmount(draft.amount) } : {}),
          description: draft.description,
          category: draft.category,
          date: draft.date,
          paymentType: draft.paymentType,
          installments: draft.installments,
          currency: draft.currency,
        });
        return draftFields(draft, { payment: !isOneTimeGroup });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('expenseForm.submitFailed'));
    }
  };

  // Pegar una captura es lo más cercano a compartir hacia la app que hay en iOS: Safari no
  // implementa Web Share Target, así que la hoja de compartir no puede llegar hasta acá.
  const handlePaste = (e: React.ClipboardEvent) => {
    const image = Array.from(e.clipboardData.files).find(f => f.type.startsWith('image/'));
    if (image) { e.preventDefault(); scanImage(image); }
  };

  /* ── Guardar ──────────────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setError('');
    if (amount <= 0) { setError(t('expenseForm.amountRequired')); return; }
    if (!form.description.trim()) { setError(t('expenseForm.descriptionRequired')); return; }

    if (mode === 'loan') {
      if (form.loanTargetId == null) { setError(t('expenseForm.chooseLoanTarget')); return; }
    } else {
      if (!form.category) { setError(t('expenseForm.categoryRequired')); return; }
      if (form.splitStrategy.type === 'exact' && Math.abs(exactRemaining) > 0.01) {
        setError(t('expenseForm.exactError')); return;
      }
    }

    // Un préstamo es un gasto de categoría `prestamo` que carga el monto entero sobre quien
    // lo recibe: el backend mueve el saldo con la misma cuenta que cualquier otro gasto.
    const splitStrategy: SplitStrategy = mode === 'loan'
      ? { type: 'exact', amounts: { [String(form.loanTargetId)]: amount } }
      : (() => {
          const { type, percentages, amounts, participantIds } = form.splitStrategy;
          const out: SplitStrategy = { type };
          if (type === 'percentage') {
            out.percentages = Object.fromEntries(
              Object.entries(percentages ?? {}).map(([k, v]) => [k, v ?? 0]));
          } else if (type === 'exact') {
            out.amounts = Object.fromEntries(
              Object.entries(amounts ?? {}).map(([k, v]) => [k, v ?? 0]));
          } else if (participantIds != null) {
            out.participantIds = participantIds;
          }
          return out;
        })();

    const payload: ExpenseCreate = {
      description: form.description.trim(),
      amount,
      date: form.date,
      category: { name: mode === 'loan' ? 'prestamo' : form.category },
      payerId: form.payerId,
      paymentType: mode === 'loan' ? 'debit' : form.paymentType,
      installments: mode === 'loan' ? 1 : form.installments,
      currency: mode === 'loan' ? 'ARS' : form.currency,
      splitStrategy,
      // Un recurrente y un grupo de evento no llevan cuotas: no hay meses donde repartirlas.
      ...(isRecurring || isOneTimeGroup
        ? { paymentType: 'debit' as const, installments: 1 } : {}),
    };

    // Alta recurrente: no es un gasto, es una plantilla que el backend repite cada mes.
    if (isRecurring && !isEdit && groupId != null) {
      setSubmitting(true);
      try {
        const [yearStr, monthStr] = form.date.split('-');
        const { error: apiError } = await createRecurringGroupExpense(groupId, {
          description: payload.description,
          amount: payload.amount,
          category: payload.category.name,
          payerId: payload.payerId,
          paymentType: payload.paymentType,
          splitStrategy: payload.splitStrategy,
          startYear: parseInt(yearStr, 10),
          startMonth: parseInt(monthStr, 10),
          currency: payload.currency,
        });
        if (apiError) { setError(apiError); return; }
        toast.success(t('toasts.recurringExpenseCreated'));
        onSuccess?.();
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Se espera y se atrapa: `onSubmit` rechaza cuando el backend no acepta el gasto, y un
    // rechazo sin atrapar es invisible — el botón parecía no hacer nada.
    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('expenseForm.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Etiquetas de las pastillas ───────────────────────────────────────────────────── */
  const dateLabel = (() => {
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400e3));
    // "Hoy · 12 jul": la palabra ubica, el día confirma — la fila tiene lugar para las dos.
    const dayMonth = formatDayMonth(form.date, monthsShort);
    if (form.date === today) return `${t('expenseForm.pillToday')} · ${dayMonth}`;
    if (form.date === yesterday) return `${t('expenseForm.pillYesterday')} · ${dayMonth}`;
    return dayMonth;
  })();

  const splitLabel = (() => {
    if (form.splitStrategy.type === 'percentage') return t('expenseForm.pillPercentage');
    if (form.splitStrategy.type === 'exact') return t('expenseForm.pillExact');
    const count = form.splitStrategy.participantIds?.length ?? members.length;
    return t('expenseForm.pillEqual', { count });
  })();

  const payerLabel = form.payerId === currentMemberId
    ? t('expenseForm.pillPaidByYou')
    : t('expenseForm.pillPaidBy', { name: memberName(form.payerId) });

  const paymentLabel = form.paymentType === 'credit' && form.installments > 1
    ? t('expenseForm.pillInstallments', { count: form.installments })
    : t('expenseForm.debit');

  const nextMonthName = (() => {
    // El mes siguiente al del gasto; `% 12` envuelve diciembre a enero.
    const month = Number(form.date.split('-')[1]);
    return months[month % 12];
  })();

  const showContext = !hidePayerAndSplit;
  const showPayment = showContext && mode === 'expense' && !isOneTimeGroup && !isRecurring;
  const canPickMode = !isEdit && !hidePayerAndSplit && members.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 rounded-t-sheet"
        showCloseButton={false}
        onPaste={handlePaste}
      >
        {/* ── Barra superior ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-1">
          <DialogTitle className="text-[13px] font-bold text-foreground">
            {isEdit ? t('expenseForm.editExpense') : t('expenseForm.addExpense')}
          </DialogTitle>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t('common.cancel')}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-1 hover:bg-surface-sunken hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc((100dvh-var(--keyboard-inset,0px))*0.88-3rem)] overflow-y-auto px-5 pb-5">
          {scan.scanning && <ScanReading receipt={scan.receipt} />}
          <div hidden={scan.scanning}>
          <ScanReviewNotice receipt={scan.receipt} confidence={scan.confidence} />
          {/* ── Segmented: qué estás anotando ──────────────────────────────────────── */}
          {canPickMode && (
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'expense', label: t('expenseForm.modeExpense') },
                { value: 'loan', label: t('expenseForm.modeLoan') },
              ]}
            />
          )}

          {/* ── El monto, que es de lo que se trata la pantalla ────────────────────── */}
          <div className="pt-5 text-center">
            <AmountInput
              value={form.amountText}
              onChange={v => { set({ amountText: v }); scan.touch('amount'); }}
              disabled={disabled}
            />
            {scan.fromPhoto.has('amount') && <div className="mt-1.5 flex justify-center"><FromPhotoPill /></div>}

            <div className="mt-2.5 flex justify-center gap-1.5">
              {(['ARS', 'USD'] as const).map(currency => (
                <button
                  key={currency}
                  type="button"
                  disabled={disabled || mode === 'loan'}
                  onClick={() => set({ currency })}
                  className={cn(
                    'h-7 rounded-pill px-3 text-[11.5px] font-bold transition-colors',
                    form.currency === currency
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-line-strong text-muted-1',
                    (disabled || mode === 'loan') ? 'cursor-default opacity-60' : 'cursor-pointer',
                  )}
                >
                  {currency === 'USD' && blueRate
                    ? t('expenseForm.blueRate', { rate: Math.round(blueRate) })
                    : currency}
                </button>
              ))}
            </div>
          </div>

          {/* ── Qué fue ────────────────────────────────────────────────────────────── */}
          <input
            type="text"
            value={form.description}
            maxLength={255}
            disabled={disabled}
            onChange={e => { set({ description: e.target.value }); scan.touch('description'); }}
            placeholder={t('expenseForm.whatWasIt')}
            className={cn(
              'mt-4 w-full bg-transparent text-center text-[15px] font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-3',
              scan.fromPhoto.has('description')
                ? 'rounded-[12px] border border-brand-soft px-3 py-2'
                : 'border-0',
            )}
          />
          {scan.fromPhoto.has('description') && <div className="mt-1.5 flex justify-center"><FromPhotoPill /></div>}

          {/* ── Categorías ─────────────────────────────────────────────────────────── */}
          {mode === 'expense' && (
            <CategoryChips
              className="mt-4"
              categories={categories}
              value={form.category}
              onChange={name => set({ category: name })}
              disabled={disabled}
            />
          )}

          {/* ── Contexto: una fila por decisión, cada una con su selector ──────────── */}
          <ContextCard className="mt-3">
            {showContext && (
              <ContextRow
                label={t('expenseForm.rowPayer')}
                value={payerLabel}
                onClick={() => setPicker('payer')}
                disabled={disabled}
              />
            )}
            {showContext && mode === 'loan' && (
              <ContextRow
                label={t('expenseForm.rowLoanTarget')}
                value={form.loanTargetId ? memberName(form.loanTargetId) : t('expenseForm.rowChoose')}
                onClick={() => setPicker('loanTarget')}
                disabled={disabled}
              />
            )}
            {showContext && mode === 'expense' && (
              <ContextRow
                label={t('expenseForm.rowSplit')}
                value={splitLabel}
                onClick={() => setPicker('split')}
                disabled={disabled}
              />
            )}
            <ContextRow
              label={t('expenseForm.rowWhen')}
              value={dateLabel}
              onClick={() => setPicker('date')}
              disabled={disabled}
              badge={scan.fromPhoto.has('date') ? <FromPhotoPill /> : undefined}
            />
            {showPayment && (
              <ContextRow
                label={t('expenseForm.rowPayment')}
                value={paymentLabel}
                onClick={() => setPicker('payment')}
                disabled={disabled}
                badge={scan.fromPhoto.has('payment') ? <FromPhotoPill /> : undefined}
              />
            )}
            {FEATURE_RECEIPTS && <ReceiptRow receipt={scan.receipt} onAttach={scan.attach} />}
          </ContextCard>

          {/* ── Se repite cada mes ─────────────────────────────────────────────────── */}
          {!isEdit && showContext && !isOneTimeGroup && mode === 'expense' && (
            <div className="mt-3 rounded-card border border-line bg-surface p-3.5">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-foreground">
                    {t('expenseForm.repeatCard')}
                  </span>
                  {isRecurring && (
                    <span className="mt-0.5 block text-[11.5px] font-medium text-muted-2">
                      {t('expenseForm.repeatNote', { month: nextMonthName })}
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  disabled={disabled}
                  onChange={e => {
                    setIsRecurring(e.target.checked);
                    if (e.target.checked) set({ paymentType: 'debit', installments: 1 });
                  }}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                    isRecurring ? 'bg-brand' : 'bg-surface-sunken',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all',
                      isRecurring ? 'left-[18px]' : 'left-0.5',
                    )}
                  />
                </span>
              </label>
            </div>
          )}

          {isRecurringEdit && (
            <p className="mt-3 text-[11.5px] font-medium text-muted-2">
              {t('expenseForm.recurringEditNote')}
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-[12px] border border-negative-wash-line bg-negative-wash px-3 py-2 text-[12px] font-semibold text-negative-ink">
              {error}
            </p>
          )}

          {/* Pegado abajo: con el teclado del celular abierto, "Guardar" sigue a la vista. */}
          <div className="sticky bottom-0 -mx-5 mt-3 bg-popover px-5 pb-1 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || submitting}
              className="h-12 w-full cursor-pointer rounded-[14px] bg-brand text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? t('expenseForm.saving')
                : isEdit
                  ? t('expenseForm.update')
                  : mode === 'loan' ? t('expenseForm.saveLoan') : t('expenseForm.saveExpense')}
            </button>
          </div>
          </div>
        </div>

        {/* ── Selectores: cada pastilla abre el suyo, encima de la hoja ───────────── */}
        {picker && (
          <div className="absolute inset-0 z-10 flex flex-col bg-popover">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setPicker(null)}
                aria-label={t('common.back')}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-1 hover:bg-surface-sunken"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-[13px] font-bold text-foreground">
                {picker === 'payer' && t('expenseForm.choosePayer')}
                {picker === 'loanTarget' && t('expenseForm.chooseLoanTarget')}
                {picker === 'split' && t('expenseForm.chooseSplit')}
                {picker === 'date' && t('expenseForm.chooseDate')}
                {picker === 'payment' && t('expenseForm.choosePayment')}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {(picker === 'payer' || picker === 'loanTarget') && (
                <div className="space-y-1.5">
                  {members
                    .filter(m => picker !== 'loanTarget' || m.id !== form.payerId)
                    .map(m => {
                      const selected = picker === 'payer'
                        ? form.payerId === m.id
                        : form.loanTargetId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (picker === 'payer') set({ payerId: m.id });
                            else set({ loanTargetId: m.id });
                            setPicker(null);
                          }}
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors',
                            selected
                              ? 'border-brand bg-brand-wash'
                              : 'border-line hover:bg-surface-sunken',
                          )}
                        >
                          <span className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                            avatarBg(m.id),
                          )}>
                            {initials(m.name)}
                          </span>
                          <span className="text-[13px] font-semibold text-foreground">{m.name}</span>
                        </button>
                      );
                    })}
                </div>
              )}

              {picker === 'date' && (
                <DatePicker value={form.date} onChange={date => { set({ date }); scan.touch('date'); }} />
              )}

              {picker === 'payment' && (
                <PaymentPicker
                  paymentType={form.paymentType}
                  installments={form.installments}
                  onChange={next => { set(next); scan.touch('payment'); }}
                />
              )}

              {picker === 'split' && (
                <div className="space-y-4">
                  <div className="flex gap-1.5">
                    {(['equal', 'percentage', 'exact'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set({
                          splitStrategy: {
                            type,
                            percentages: type === 'percentage'
                              ? Object.fromEntries(members.map(m => [String(m.id), null])) : null,
                            amounts: type === 'exact'
                              ? Object.fromEntries(members.map(m => [String(m.id), null])) : null,
                            participantIds: null,
                          },
                        })}
                        className={cn(
                          'h-9 flex-1 cursor-pointer rounded-pill text-[12px] font-bold transition-colors',
                          form.splitStrategy.type === type
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-line-strong text-muted-1',
                        )}
                      >
                        {t(`expenseForm.${type}`)}
                      </button>
                    ))}
                  </div>

                  {form.splitStrategy.type === 'equal' && members.length > 2 && (
                    <div>
                      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
                        {t('expenseForm.participants')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {members.map(m => {
                          const ids = form.splitStrategy.participantIds;
                          const checked = ids == null || ids.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                const current = ids ?? members.map(x => x.id);
                                const next = checked
                                  ? current.filter(id => id !== m.id)
                                  : [...current, m.id];
                                set({
                                  splitStrategy: {
                                    ...form.splitStrategy,
                                    participantIds: next.length === members.length ? null : next,
                                  },
                                });
                              }}
                              className={cn(
                                'h-9 cursor-pointer rounded-pill px-3 text-[12px] font-bold transition-colors',
                                checked
                                  ? 'bg-brand-wash text-brand-ink ring-1 ring-brand'
                                  : 'border border-line-strong text-muted-3',
                              )}
                            >
                              {m.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {form.splitStrategy.type === 'percentage' && (
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <span className="w-24 truncate text-[12.5px] font-medium">{m.name}</span>
                          <Input
                            type="number" min="0" max="100" step="0.01" className="w-24"
                            value={form.splitStrategy.percentages?.[m.id] ?? ''}
                            onChange={e => set({
                              splitStrategy: {
                                ...form.splitStrategy,
                                percentages: {
                                  ...form.splitStrategy.percentages,
                                  [m.id]: e.target.value === '' ? null : parseFloat(e.target.value),
                                },
                              },
                            })}
                          />
                          <span className="text-[12.5px] text-muted-2">%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {form.splitStrategy.type === 'exact' && (
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <span className="w-24 truncate text-[12.5px] font-medium">{m.name}</span>
                          <Input
                            type="number" min="0" step="0.01" className="w-28"
                            value={form.splitStrategy.amounts?.[m.id] ?? ''}
                            onChange={e => set({
                              splitStrategy: {
                                ...form.splitStrategy,
                                amounts: {
                                  ...form.splitStrategy.amounts,
                                  [m.id]: e.target.value === '' ? null : parseFloat(e.target.value),
                                },
                              },
                            })}
                          />
                        </div>
                      ))}
                      <p className={cn(
                        'text-[11.5px] font-semibold',
                        Math.abs(exactRemaining) <= 0.01 ? 'text-positive' : 'text-negative',
                      )}>
                        {Math.abs(exactRemaining) <= 0.01
                          ? t('expenseForm.amountsCorrect')
                          : exactRemaining > 0
                            ? t('expenseForm.unassigned', { amount: exactRemaining.toFixed(2) })
                            : t('expenseForm.overBy', { amount: Math.abs(exactRemaining).toFixed(2) })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-line p-4">
              <button
                type="button"
                onClick={() => setPicker(null)}
                className="h-11 w-full cursor-pointer rounded-[12px] bg-primary text-[13px] font-bold text-primary-foreground"
              >
                {t('expenseForm.done')}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
