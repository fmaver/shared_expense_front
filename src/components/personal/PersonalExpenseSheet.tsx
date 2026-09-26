import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePersonalContext } from '@/hooks/usePersonalContext';
import { AmountKeypad } from '@/components/expenses/AmountKeypad';
import { CategoryChips } from '@/components/expenses/CategoryChips';
import { ContextCard, ContextRow } from '@/components/expenses/ContextRows';
import {
  DatePicker, PaymentPicker, PickerOverlay, StartMonthPicker,
} from '@/components/expenses/ContextPickers';
import {
  formatDate, formatDayMonth, formatKeypadAmount, parseKeypadAmount,
} from '@/utils/format';
import { checkSimilarExpenses, createExpense, parseExpenseImage } from '@/api/expenses';
import { createRecurringPersonalExpense } from '@/api/personal';
import type {
  CategoryWithEmoji, ExpenseResponse, RecurringPersonalExpenseInstanceResponse,
} from '@/types/expense';

/** Una vez, o todos los meses. */
type Kind = 'expense' | 'fixed';
type Picker = null | 'date' | 'payment' | 'start';

interface PersonalExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind: Kind;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  existingRecurring: RecurringPersonalExpenseInstanceResponse[];
  /** Vuelve a la matriz: lo que se eligió ahí se puede cambiar sin cerrar todo. */
  onBack: () => void;
  onSaved: () => void;
}

/**
 * Un gasto tuyo: el que pasó una vez, o el que pasa todos los meses.
 *
 * Es su propia hoja y no la del grupo. La del grupo pregunta quién pagó y cómo se reparte, y
 * acá las dos respuestas son siempre la misma —vos, entero—, así que preguntarlas era hacer
 * tipear lo obvio. Lo que sí cambia es si el gasto vuelve el mes que viene, y eso es el
 * segmented de arriba: de él dependen la fecha, el pago y las cuotas.
 */
export function PersonalExpenseSheet({
  open, onOpenChange, initialKind, year, month, categories,
  existingRecurring, onBack, onSaved,
}: PersonalExpenseSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { blueRate } = useCurrency();
  const { personalGroupId, currentMemberId } = usePersonalContext();

  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  const [kind, setKind] = useState<Kind>(initialKind);
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [date, setDate] = useState(formatDate(new Date()));
  const [paymentType, setPaymentType] = useState<'debit' | 'credit'>('debit');
  const [installments, setInstallments] = useState(1);
  const [startYear, setStartYear] = useState(year);
  const [startMonth, setStartMonth] = useState(month);
  const [picker, setPicker] = useState<Picker>(null);
  const [duplicate, setDuplicate] = useState<ExpenseResponse | 'fixed' | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setAmountText('');
    setDescription('');
    setCurrency('ARS');
    setDate(formatDate(new Date()));
    setPaymentType('debit');
    setInstallments(1);
    setStartYear(year);
    setStartMonth(month);
    setPicker(null);
    setDuplicate(null);
    setError('');
    setScanNote(null);
  }, [open, initialKind, year, month]);

  /* Las categorías llegan por red: sin esto el guardado se traba en una validación invisible. */
  useEffect(() => {
    if (open && categories.length > 0) setCategory(c => c || categories[0].name);
  }, [open, categories]);

  const amount = parseKeypadAmount(amountText);

  /**
   * La foto del ticket, también acá.
   *
   * Es el mismo `parse-image` del grupo, apuntado al grupo personal: una expensa o un ticket
   * de súper se escanea igual sea tuyo o compartido. Lo que no aplica se descarta solo — un
   * gasto fijo no tiene fecha ni cuotas, así que de la foto se queda con el monto, el nombre
   * y la categoría.
   */
  const scanImage = async (file: File) => {
    if (!personalGroupId || scanning) return;
    setScanning(true);
    setScanNote(null);
    setError('');
    try {
      const draft = await parseExpenseImage(personalGroupId, file);
      if (draft.amount != null) setAmountText(formatKeypadAmount(draft.amount));
      setDescription(draft.description);
      setCategory(draft.category);
      setCurrency(draft.currency === 'USD' ? 'USD' : 'ARS');
      if (kind === 'expense') {
        setDate(draft.date);
        setPaymentType(draft.paymentType);
        setInstallments(draft.installments);
      }
      setScanNote(draft.confidence === 'low'
        ? t('expenseForm.scanLowConfidence')
        : t('expenseForm.scanFilled'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('expenseForm.scanFailed'));
    } finally {
      setScanning(false);
    }
  };

  const dateLabel = (() => {
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400e3));
    if (date === today) return `${t('expenseForm.pillToday')} · ${formatDayMonth(date, monthsShort)}`;
    if (date === yesterday) return `${t('expenseForm.pillYesterday')} · ${formatDayMonth(date, monthsShort)}`;
    return formatDayMonth(date, monthsShort);
  })();

  const paymentLabel = paymentType === 'credit' && installments > 1
    ? t('expenseForm.pillInstallments', { count: installments })
    : t('expenseForm.debit');

  const startLabel = `${months[startMonth - 1] ?? ''} ${startYear}`;
  // La fila lo muestra como título; la nota lo mete en una oración, y ahí va en minúscula.
  const startLabelInline = startLabel.toLocaleLowerCase();

  const save = async (skipDuplicateCheck = false) => {
    setError('');
    if (amount <= 0) { setError(t('expenseForm.amountRequired')); return; }
    if (!description.trim()) { setError(t('expenseForm.descriptionRequired')); return; }
    if (!category) { setError(t('expenseForm.categoryRequired')); return; }
    if (!personalGroupId || !currentMemberId) return;

    setSaving(true);
    try {
      if (kind === 'fixed') {
        if (!skipDuplicateCheck) {
          const clash = existingRecurring.some(
            e => e.label.trim().toLocaleLowerCase() === description.trim().toLocaleLowerCase()
              && Math.abs(e.amount - amount) < 0.01,
          );
          if (clash) { setDuplicate('fixed'); return; }
        }
        await createRecurringPersonalExpense({
          label: description.trim(),
          amount,
          categoryName: category,
          startYear,
          startMonth,
          currency,
        });
      } else {
        if (!skipDuplicateCheck) {
          const [y, m] = date.split('-').map(Number);
          const { data: similar } = await checkSimilarExpenses(
            personalGroupId, y, m, amount, description.trim(), date,
          );
          if (similar && similar.length > 0) { setDuplicate(similar[0]); return; }
        }
        const { error: apiError } = await createExpense(personalGroupId, {
          description: description.trim(),
          amount,
          date,
          category: { name: category },
          payerId: currentMemberId,
          paymentType,
          installments: paymentType === 'credit' ? installments : 1,
          currency,
          splitStrategy: { type: 'equal' },
        });
        if (apiError) { setError(apiError); return; }
      }
      toast.success(t('toasts.expenseAdded'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 rounded-t-sheet" showCloseButton={false}>
        {/* ── Barra superior: qué estás cargando, y cómo volver a elegir ────────────── */}
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t('common.cancel')}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-1 hover:bg-surface-sunken hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <DialogTitle className="text-[13px] font-bold text-foreground">
              {t(kind === 'fixed' ? 'personalAdd.fixedTitle' : 'personalAdd.expenseTitle')}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-1">
            <label
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-muted-1',
                scanning ? 'opacity-50' : 'cursor-pointer hover:bg-surface-sunken hover:text-foreground',
              )}
              title={t('expenseForm.scanImage')}
            >
              <ImagePlus className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={scanning}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) scanImage(file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={onBack}
              className="h-8 cursor-pointer rounded-pill border border-line-strong px-3 text-[11.5px] font-bold text-muted-1 transition-colors hover:bg-surface-sunken"
            >
              {t('personalAdd.change')}
            </button>
          </div>
        </div>

        <div className="max-h-[calc(88dvh-3rem)] overflow-y-auto px-5 pb-5">
          {/* ── Una vez, o todos los meses ─────────────────────────────────────────── */}
          <div className="flex gap-1 rounded-pill bg-surface-sunken p-1">
            {([
              { value: 'expense' as const, label: t('personalAdd.segmentOnce') },
              { value: 'fixed' as const, label: t('personalAdd.segmentFixed') },
            ]).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                className={cn(
                  'h-8 flex-1 cursor-pointer rounded-pill text-[12.5px] font-bold transition-colors',
                  kind === option.value ? 'bg-negative text-white dark:text-ink' : 'text-muted-1',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* ── El monto ───────────────────────────────────────────────────────────── */}
          <div className="pt-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[22px] font-semibold text-muted-2">$</span>
              <span className="text-[52px] font-bold leading-none tracking-[-0.035em] tabular-nums text-foreground">
                {amountText || '0'}
              </span>
              <span className="h-[46px] w-[2px] animate-pulse bg-brand" aria-hidden="true" />
            </div>

            <div className="mt-2.5 flex justify-center gap-1.5">
              {(['ARS', 'USD'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'h-7 cursor-pointer rounded-pill px-3 text-[11.5px] font-bold transition-colors',
                    currency === c
                      ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                      : 'border border-line-strong text-muted-1',
                  )}
                >
                  {c === 'USD' && blueRate ? t('expenseForm.blueRate', { rate: Math.round(blueRate) }) : c}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={description}
            maxLength={255}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('expenseForm.whatWasIt')}
            className="mt-4 w-full border-0 bg-transparent text-center text-[15px] font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-3"
          />

          {scanNote && (
            <p className="mt-2 text-center text-[11.5px] font-medium text-brand-ink">{scanNote}</p>
          )}

          <CategoryChips
            className="mt-4"
            categories={categories}
            value={category}
            onChange={setCategory}
          />

          {/* ── El contexto, según si vuelve o no ──────────────────────────────────── */}
          {kind === 'expense' ? (
            <ContextCard className="mt-3">
              <ContextRow label={t('personalAdd.rowWhen')} value={dateLabel} onClick={() => setPicker('date')} />
              <ContextRow label={t('personalAdd.rowPayment')} value={paymentLabel} onClick={() => setPicker('payment')} />
            </ContextCard>
          ) : (
            <>
              <p className="mt-3 text-[11.5px] font-medium leading-[1.45] text-muted-2">
                {t('personalAdd.fixedNoDate')}
              </p>
              <ContextCard className="mt-2">
                <ContextRow
                  label={t('personalAdd.rowSince')}
                  value={startLabel}
                  onClick={() => setPicker('start')}
                />
              </ContextCard>
              <p className="mt-2 text-[11.5px] font-medium leading-[1.45] text-muted-2">
                {t('personalAdd.fixedSinceNote', { month: startLabelInline })}
              </p>
              <p className="mt-3 rounded-card border border-brand-wash-line bg-brand-wash px-3.5 py-3 text-[11.5px] font-medium leading-[1.5] text-brand-ink">
                {t('personalAdd.fixedCreditWarning')}
              </p>
            </>
          )}

          {/* ── Esto ya está cargado ───────────────────────────────────────────────── */}
          {duplicate && (
            <div className="mt-3 rounded-card border border-negative-wash-line bg-negative-wash p-3.5">
              <p className="text-[13px] font-bold text-negative-ink">{t('personalAdd.duplicateTitle')}</p>
              <p className="mt-1 text-[11.5px] font-medium leading-[1.5] text-negative-ink/85">
                {duplicate === 'fixed'
                  ? t('personalAdd.duplicateFixedDesc')
                  : t('personalAdd.duplicateDesc', {
                      description: duplicate.description,
                      date: formatDayMonth(duplicate.date, monthsShort),
                    })}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/personal/expenses?year=${year}&month=${month}`);
                  }}
                  className="h-9 flex-1 cursor-pointer rounded-pill bg-ink text-[12px] font-bold text-paper transition-opacity hover:opacity-90 dark:bg-paper dark:text-ink"
                >
                  {t('personalAdd.duplicateSeeExisting')}
                </button>
                <button
                  type="button"
                  onClick={() => { setDuplicate(null); save(true); }}
                  className="h-9 shrink-0 cursor-pointer rounded-pill border border-negative/40 px-3.5 text-[12px] font-bold text-negative-ink transition-colors hover:bg-negative-wash"
                >
                  {t('personalAdd.duplicateSaveAnyway')}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-[12px] border border-negative-wash-line bg-negative-wash px-3 py-2 text-[12px] font-semibold text-negative-ink">
              {error}
            </p>
          )}

          <AmountKeypad className="mt-4" value={amountText} onChange={setAmountText} />

          <button
            type="button"
            onClick={() => save()}
            disabled={saving || duplicate !== null}
            className="mt-3 h-12 w-full cursor-pointer rounded-[14px] bg-brand text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving
              ? t('expenseForm.saving')
              : t(kind === 'fixed' ? 'personalAdd.saveFixed' : 'personalAdd.saveExpense')}
          </button>
        </div>

        {picker === 'date' && (
          <PickerOverlay title={t('expenseForm.chooseDate')} onClose={() => setPicker(null)}>
            <DatePicker value={date} onChange={setDate} />
          </PickerOverlay>
        )}
        {picker === 'payment' && (
          <PickerOverlay title={t('expenseForm.choosePayment')} onClose={() => setPicker(null)}>
            <PaymentPicker
              paymentType={paymentType}
              installments={installments}
              onChange={next => { setPaymentType(next.paymentType); setInstallments(next.installments); }}
            />
          </PickerOverlay>
        )}
        {picker === 'start' && (
          <PickerOverlay title={t('personalAdd.chooseStart')} onClose={() => setPicker(null)}>
            <StartMonthPicker
              year={startYear}
              month={startMonth}
              onChange={(y, m) => { setStartYear(y); setStartMonth(m); }}
            />
          </PickerOverlay>
        )}
      </DialogContent>
    </Dialog>
  );
}
