import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AmountInput } from '@/components/expenses/AmountInput';
import { ContextCard, ContextRow } from '@/components/expenses/ContextRows';
import { PickerOverlay, StartMonthPicker } from '@/components/expenses/ContextPickers';
import { formatCurrency, parseKeypadAmount } from '@/utils/format';
import { createRecurringIncome, createVariableIncome } from '@/api/personal';
import type { IncomeInstanceResponse } from '@/types/expense';

/** Un extra que entró una vez, o el sueldo que entra todos los meses. */
type Kind = 'extra' | 'salary';

interface PersonalIncomeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind: Kind;
  year: number;
  month: number;
  existingIncomes: IncomeInstanceResponse[];
  /** Lo que te queda hoy, para decir en cuánto quedaría con esto cargado. */
  currentBalance: number;
  onBack: () => void;
  onSaved: () => void;
}

/**
 * Un ingreso: el extra y el sueldo, en el mismo formulario.
 *
 * Son la misma pregunta con dos respuestas —"¿esto vuelve el mes que viene?"—, así que eran dos
 * diálogos separados cuando podían ser un segmented. Y como un ingreso no tiene categoría ni
 * forma de pago, lo único que queda debajo del monto es el nombre y desde cuándo.
 *
 * La caja verde dice la consecuencia: cargar plata es para saber cuánto te queda, y si eso hay
 * que ir a buscarlo a otra pantalla, el formulario contó sólo la mitad.
 */
export function PersonalIncomeSheet({
  open, onOpenChange, initialKind, year, month, existingIncomes,
  currentBalance, onBack, onSaved,
}: PersonalIncomeSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { blueRate } = useCurrency();

  const months = t('months', { returnObjects: true }) as string[];

  const [kind, setKind] = useState<Kind>(initialKind);
  const [amountText, setAmountText] = useState('');
  const [label, setLabel] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [startYear, setStartYear] = useState(year);
  const [startMonth, setStartMonth] = useState(month);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [duplicate, setDuplicate] = useState<IncomeInstanceResponse | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setAmountText('');
    setLabel('');
    setCurrency('ARS');
    setStartYear(year);
    setStartMonth(month);
    setPickerOpen(false);
    setDuplicate(null);
    setError('');
  }, [open, initialKind, year, month]);

  const amount = parseKeypadAmount(amountText);
  const startLabel = `${months[startMonth - 1] ?? ''} ${startYear}`;
  // La fila lo muestra como título; la nota lo mete en una oración, y ahí va en minúscula.
  const startLabelInline = startLabel.toLocaleLowerCase();
  const monthLabel = (months[month - 1] ?? '').toLocaleLowerCase();

  const save = async (skipDuplicateCheck = false) => {
    setError('');
    if (amount <= 0) { setError(t('expenseForm.amountRequired')); return; }
    if (!label.trim()) { setError(t('personalAdd.nameRequired')); return; }

    if (!skipDuplicateCheck) {
      const clash = existingIncomes.find(
        i => i.label.trim().toLocaleLowerCase() === label.trim().toLocaleLowerCase()
          && Math.abs(i.amount - amount) < 0.01,
      );
      if (clash) { setDuplicate(clash); return; }
    }

    setSaving(true);
    try {
      if (kind === 'salary') {
        await createRecurringIncome({
          label: label.trim(), amount, startYear, startMonth, currency,
        });
      } else {
        await createVariableIncome({ year, month, label: label.trim(), amount, currency });
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
              {t('personalAdd.incomeTitle')}
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="h-8 cursor-pointer rounded-full bg-brand-wash px-2.5 text-[11px] font-bold text-brand-ink transition-opacity hover:opacity-80"
          >
            {t('personalAdd.change')}
          </button>
        </div>

        <div className="max-h-[calc((100dvh-var(--keyboard-inset,0px))*0.88-3rem)] overflow-y-auto px-5 pb-5">
          <div className="flex gap-1 rounded-[14px] bg-line-soft p-1">
            {([
              { value: 'extra' as const, label: t('personalAdd.segmentExtra') },
              { value: 'salary' as const, label: t('personalAdd.segmentSalary') },
            ]).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                className={cn(
                  'h-[34px] flex-1 cursor-pointer rounded-[11px] text-[12.5px] font-bold transition-colors',
                  kind === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-1',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="pt-5 text-center">
            <AmountInput value={amountText} onChange={setAmountText} tone="positive" />

            <div className="mt-2.5 flex justify-center gap-1.5">
              {(['ARS', 'USD'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'h-7 cursor-pointer rounded-pill px-3 text-[11.5px] font-bold transition-colors',
                    currency === c
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-line-strong text-muted-1',
                  )}
                >
                  {c === 'USD' && blueRate ? t('expenseForm.blueRate', { rate: Math.round(blueRate) }) : c}
                </button>
              ))}
            </div>
          </div>

          {/* ── Cómo se llama ──────────────────────────────────────────────────────── */}
          <p className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
            {t('personalAdd.nameLabel')}
          </p>
          <input
            type="text"
            value={label}
            maxLength={120}
            onChange={e => setLabel(e.target.value)}
            placeholder={t(kind === 'salary' ? 'personalAdd.namePlaceholderSalary' : 'personalAdd.namePlaceholderExtra')}
            className="mt-1.5 h-11 w-full rounded-card border border-line bg-surface px-3.5 text-[14px] font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-3 focus:border-line-strong"
          />

          {/* ── Desde cuándo: sólo lo que vuelve tiene desde cuándo ────────────────── */}
          {kind === 'salary' && (
            <>
              <ContextCard className="mt-3">
                <ContextRow
                  label={t('personalAdd.rowSince')}
                  value={startLabel}
                  onClick={() => setPickerOpen(true)}
                />
              </ContextCard>
              <p className="mt-2 text-[11.5px] font-medium leading-[1.45] text-muted-2">
                {t('personalAdd.salarySinceNote', { month: startLabelInline })}
              </p>
            </>
          )}

          {/* ── La consecuencia, que es para lo que se carga esto ──────────────────── */}
          {amount > 0 && (
            <p className="mt-3 rounded-card border border-positive-wash-line bg-positive-wash px-3.5 py-3 text-[11.5px] font-medium leading-[1.5] text-positive">
              {t('personalAdd.incomeConsequence', {
                month: monthLabel,
                amount: formatCurrency(currentBalance + (currency === 'ARS' ? amount : amount * (blueRate ?? 1))),
              })}
            </p>
          )}

          {duplicate && (
            <div className="mt-3 rounded-card border border-negative-wash-line bg-negative-wash p-3.5">
              <p className="text-[13px] font-bold text-negative-ink">{t('personalAdd.duplicateTitle')}</p>
              <p className="mt-1 text-[11.5px] font-medium leading-[1.5] text-negative-ink/85">
                {t('personalAdd.duplicateIncomeDesc', { label: duplicate.label })}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/personal/incomes?year=${year}&month=${month}`);
                  }}
                  className="h-9 flex-1 cursor-pointer rounded-pill bg-primary text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
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

          {/* Pegado abajo: con el teclado del celular abierto, "Guardar" sigue a la vista. */}
          <div className="sticky bottom-0 -mx-5 mt-3 bg-popover px-5 pb-1 pt-2">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving || duplicate !== null}
              className="h-12 w-full cursor-pointer rounded-[14px] bg-primary text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? t('expenseForm.saving')
                : t(kind === 'salary' ? 'personalAdd.saveSalary' : 'personalAdd.saveExtra')}
            </button>
          </div>
        </div>

        {pickerOpen && (
          <PickerOverlay title={t('personalAdd.chooseStart')} onClose={() => setPickerOpen(false)}>
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
