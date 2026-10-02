import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  evenSplit,
  fillRemainder,
  formatSplitInput,
  parseSplitInput,
  remainderTarget,
  sanitizeSplitInput,
  splitStatus,
  type EditableSplit,
  type SplitValues,
} from '@/utils/splitEditing';

/**
 * Porcentajes o montos exactos, persona por persona.
 *
 * Arranca repartido en partes iguales (lo arma quien lo monta), muestra al lado de cada número
 * su equivalente ("40% → $16.000" / "$16.000 → 40%"), y abajo un estado en vivo: "✓ Suman
 * 100%", "Faltan 10%" o "Te pasaste 5%", con "Completar con el resto" para no hacer la cuenta.
 * Los campos son texto con teclado decimal: `type="number"` en iOS no siempre deja la coma.
 */
export function SplitValuesEditor({
  type, members, amount, currency, values, onChange,
}: {
  type: EditableSplit;
  members: { id: number; name: string }[];
  amount: number;
  currency: string;
  values: SplitValues;
  onChange: (values: SplitValues) => void;
}) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const ids = members.map(m => String(m.id));
  // Lo tipeado viaja como texto ("33,") mientras se escribe; el número va al formulario.
  const [drafts, setDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(ids.map(id => [id, formatSplitInput(values[id])])),
  );
  const [touched, setTouched] = useState<Set<string>>(() => new Set());

  // Si se eligió "Montos exactos" antes de cargar el monto, quedó vacío: al volver con monto,
  // arranca repartido en partes iguales como cuando se elige con el monto ya puesto.
  useEffect(() => {
    if (type !== 'exact' || amount <= 0) return;
    if (ids.some(id => values[id] != null)) return;
    const even = evenSplit(ids, amount);
    setDrafts(Object.fromEntries(ids.map(id => [id, formatSplitInput(even[id])])));
    onChange(even);
    // Sólo al montar: después manda lo que se tipea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = splitStatus(type, values, amount);
  const target = remainderTarget(ids, touched, values, status.diff);
  const fmt = (n: number) => (type === 'percentage' ? `${formatSplitInput(n)}%` : formatAmount(n, currency));

  const setOne = (id: string, raw: string) => {
    const clean = sanitizeSplitInput(raw);
    setDrafts(d => ({ ...d, [id]: clean }));
    setTouched(s => new Set(s).add(id));
    onChange({ ...values, [id]: parseSplitInput(clean) });
  };

  const complete = () => {
    if (!target) return;
    const next = fillRemainder(values, target, status.diff);
    setDrafts(d => ({ ...d, [target]: formatSplitInput(next[target]) }));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {members.map(m => {
        const id = String(m.id);
        const v = values[id] ?? 0;
        const equivalent = type === 'percentage'
          ? formatAmount((amount * v) / 100, currency)
          : amount > 0 ? `${formatSplitInput(Math.round((v / amount) * 1000) / 10)}%` : '';
        return (
          <div key={id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">{m.name}</span>
            <label className="flex h-10 w-28 shrink-0 items-center gap-1 rounded-[12px] border border-line-strong bg-surface px-2.5 focus-within:border-brand-soft">
              {type === 'exact' && <span className="text-[13px] font-semibold text-muted-2">$</span>}
              <input
                type="text"
                inputMode="decimal"
                value={drafts[id] ?? ''}
                onChange={e => setOne(id, e.target.value)}
                placeholder="0"
                aria-label={t(type === 'percentage' ? 'splitEditor.percentOf' : 'splitEditor.amountOf', { name: m.name })}
                className="min-w-0 flex-1 bg-transparent text-right text-[16px] font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-3"
              />
              {type === 'percentage' && <span className="text-[13px] font-semibold text-muted-2">%</span>}
            </label>
            <span className="w-[76px] shrink-0 truncate text-right text-[11.5px] font-medium tabular-nums text-muted-2">
              {equivalent && `→ ${equivalent}`}
            </span>
          </div>
        );
      })}

      {type === 'exact' && amount <= 0 ? (
        // Sin monto no hay contra qué repartir: el estado lo dice en vez de "Te pasaste $0".
        <p className="mt-1 rounded-[12px] bg-surface-sunken px-3 py-2.5 text-[12.5px] font-semibold text-muted-1" role="status">
          {t('splitEditor.needAmount')}
        </p>
      ) : (
      <div
        className={cn(
          'mt-1 flex items-center justify-between gap-2 rounded-[12px] px-3 py-2.5',
          status.ok ? 'bg-positive-wash' : 'bg-negative-wash',
        )}
        role="status"
      >
        <span className={cn('flex items-center gap-1.5 text-[12.5px] font-bold', status.ok ? 'text-positive' : 'text-negative')}>
          {status.ok && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          {status.ok
            ? t(type === 'percentage' ? 'splitEditor.okPercent' : 'splitEditor.okAmount', { total: fmt(type === 'percentage' ? 100 : amount) })
            : status.diff > 0
              ? t('splitEditor.missing', { value: fmt(status.diff) })
              : t('splitEditor.over', { value: fmt(-status.diff) })}
        </span>
        {!status.ok && target && (
          <button
            type="button"
            onClick={complete}
            className="shrink-0 cursor-pointer rounded-pill bg-surface px-3 py-1.5 text-[11.5px] font-bold text-brand-ink shadow-sm"
          >
            {t(status.diff > 0 ? 'splitEditor.addTo' : 'splitEditor.takeFrom', { name: members.find(m => String(m.id) === target)?.name ?? '' })}
          </button>
        )}
      </div>
      )}
    </div>
  );
}
