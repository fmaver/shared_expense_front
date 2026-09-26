import { useTranslation, Trans } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Lo que se puede anotar en tu plata. El panel sólo ofrece `expense` e `income`; si pasa una
 * vez o cada mes se elige adentro del formulario. `fixed` y `salary` siguen existiendo para
 * los accesos directos (el "Agregar fijo" de la lista de gastos), que abren la hoja ya en
 * "Cada mes".
 */
export type PersonalEntryKind = 'expense' | 'fixed' | 'extra' | 'salary';

interface PersonalAddMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: PersonalEntryKind) => void;
}

/**
 * "¿Qué anotamos?" — dos opciones: sale o entra (ADDENDUM-violeta.md §4).
 *
 * Eran cuatro, una grilla con "sale/entra" contra "una vez/cada mes". La segunda pregunta pasó
 * adentro del formulario como un segmentado que no borra lo cargado, así que acá queda sólo la
 * primera, que es la que se responde sin pensar.
 */
export function PersonalAddMatrix({ open, onOpenChange, onPick }: PersonalAddMatrixProps) {
  const { t } = useTranslation();

  const option = (kind: 'expense' | 'extra', tone: 'out' | 'in') => (
    <button
      type="button"
      onClick={() => onPick(kind)}
      className="flex w-full cursor-pointer items-center gap-3.5 rounded-[16px] border border-line-strong bg-surface p-4 text-left transition-[border-color,box-shadow] hover:border-brand hover:shadow-[0_0_0_3px_hsl(var(--surface-sunken))]"
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[20px] font-extrabold leading-none',
          tone === 'out' ? 'bg-negative-wash text-negative' : 'bg-positive-wash text-positive',
        )}
        aria-hidden="true"
      >
        {tone === 'out' ? '−' : '+'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-foreground">
          {t(kind === 'expense' ? 'personalAdd.expenseTitle' : 'personalAdd.incomeTitle')}
        </span>
        <span className="mt-[3px] block text-[11.5px] font-medium leading-[1.4] text-muted-1">
          {t(kind === 'expense' ? 'personalAdd.expenseDesc' : 'personalAdd.incomeDesc')}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 rounded-t-sheet" showCloseButton={false}>
        <div className="max-h-[calc(88dvh-2rem)] overflow-y-auto px-5 pb-5 pt-2">
          <DialogTitle className="text-[20px] font-bold leading-[1.2] tracking-[-0.025em] text-foreground">
            {t('personalAdd.title')}
          </DialogTitle>
          <p className="mt-2 text-[12px] font-medium leading-[1.55] text-muted-1">{t('personalAdd.subtitle')}</p>

          <div className="mt-5 flex flex-col gap-2.5">
            {option('expense', 'out')}
            {option('extra', 'in')}
          </div>

          <div className="mt-5 flex items-start gap-[9px] border-t border-line pt-4">
            <span
              className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-wash text-[10px] font-extrabold text-brand-ink"
              aria-hidden="true"
            >
              i
            </span>
            <p className="flex-1 text-[11.5px] font-medium leading-[1.5] text-muted-1">
              <Trans
                i18nKey="personalAdd.note"
                components={[<strong className="font-bold text-foreground" />, <strong className="font-bold text-foreground" />]}
              />
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
