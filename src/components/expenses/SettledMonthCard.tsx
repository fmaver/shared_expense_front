import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, FileDown, RotateCcw } from 'lucide-react';
import { capitalize, formatCurrency } from '@/utils/format';
import type { ExpenseResponse } from '@/types/expense';

interface SettledMonthCardProps {
  isOneTime: boolean;
  groupName: string;
  month: number;
  expenses: ExpenseResponse[];
  onExportPdf: () => void;
  onReopen: () => Promise<void>;
}

/**
 * El mes cerrado, arriba de su propia lista.
 *
 * Antes esto vivía adentro de una hoja: había que abrirla para enterarse de por qué no se podía
 * cargar nada. El cierre es el estado de la pantalla, no un detalle escondido, así que se dibuja
 * donde se lo va a buscar —en Gastos, encima de la lista apagada— y dice las dos cosas que
 * importan: que nadie debe nada, y qué se puede hacer igual.
 */
export function SettledMonthCard({
  isOneTime, groupName, month, expenses, onExportPdf, onReopen,
}: SettledMonthCardProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const months = t('months', { returnObjects: true }) as string[];
  const monthName = months[month - 1] ?? '';
  const nextMonthName = months[month % 12] ?? '';
  const label = isOneTime ? groupName : monthName.toLocaleLowerCase();

  /* Lo que se movió de verdad: los pagos marcados, no los gastos del mes. */
  const movedTotal = expenses
    .filter(e => e.category === 'prestamo')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="rounded-card-lg bg-ink p-5 text-center">
        <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-positive-on-dark/20">
          <Check className="h-5 w-5 text-positive-on-dark" aria-hidden="true" />
        </span>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-on-dark">
          {t('settle.closedTitle', { month: capitalize(label) })}
        </p>
        <p className="mt-2 font-display text-[30px] leading-none text-positive-on-dark">
          {t('settle.nobodyOwes')}
        </p>
        <p className="mx-auto mt-3 max-w-[36ch] text-[12px] font-medium leading-[1.5] text-muted-on-dark">
          {isOneTime
            ? t('settle.closedNoteGroup', { group: groupName })
            : movedTotal > 0
              ? t('settle.closedNote', {
                  amount: formatCurrency(movedTotal),
                  month: label,
                  next: nextMonthName.toLocaleLowerCase(),
                })
              : t('settle.closedNoteNoMoney', { month: label, next: nextMonthName.toLocaleLowerCase() })}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onExportPdf}
            className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-brand-soft text-[13px] font-bold text-ink transition-opacity hover:opacity-90"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            {isOneTime ? t('settle.pdfOfGroup') : t('settle.pdfOfMonth', { month: label })}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => { setBusy(true); try { await onReopen(); } finally { setBusy(false); } }}
            className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-paper/25 px-5 text-[13px] font-bold text-paper transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('settle.reopen')}
          </button>
        </div>
      </div>

      {/* La regla, dicha una vez y afuera de la tarjeta: es sobre la pantalla, no sobre el cierre. */}
      <p className="mt-2.5 px-1 text-[11.5px] font-medium leading-[1.45] text-muted-2">
        {isOneTime
          ? t('settle.closedFootnoteGroup', { group: groupName })
          : t('settle.closedFootnote', { month: label })}
      </p>
    </div>
  );
}
