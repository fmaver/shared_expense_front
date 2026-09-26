import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Las cuatro cosas que se pueden anotar en tu plata. */
export type PersonalEntryKind = 'expense' | 'fixed' | 'extra' | 'salary';

interface PersonalAddMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: PersonalEntryKind) => void;
  /** El mes que estás mirando, para la nota al pie. */
  monthLabel: string;
}

/**
 * "¿Qué anotamos?" — las cuatro opciones, puestas en una grilla.
 *
 * Eran cuatro entradas de un menú vertical, y ahí las diferencias entre ellas no se veían:
 * había que leer cuatro descripciones para entender que en realidad son dos preguntas, si la
 * plata sale o entra y si pasa una vez o todos los meses. Como grilla, las dos preguntas son
 * los ejes y la respuesta es la celda: se elige mirando, no leyendo.
 */
export function PersonalAddMatrix({ open, onOpenChange, onPick, monthLabel }: PersonalAddMatrixProps) {
  const { t } = useTranslation();

  const cell = (kind: PersonalEntryKind, tone: 'out' | 'in') => (
    <button
      type="button"
      onClick={() => onPick(kind)}
      className={cn(
        'flex h-full cursor-pointer flex-col rounded-card border p-3.5 text-left transition-colors',
        tone === 'out'
          ? 'border-line bg-surface hover:border-negative/40 hover:bg-negative-wash'
          : 'border-line bg-surface hover:border-positive/40 hover:bg-positive-wash',
      )}
    >
      <span className="text-[14px] font-bold leading-none text-foreground">
        {t(`personalAdd.${kind}Title`)}
      </span>
      <span className="mt-1.5 text-[11.5px] font-medium leading-[1.4] text-muted-2">
        {t(`personalAdd.${kind}Desc`)}
      </span>
    </button>
  );

  const axisLabel = (text: string) => (
    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-2">{text}</span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 rounded-t-sheet" showCloseButton={false}>
        <div className="max-h-[calc(88dvh-2rem)] overflow-y-auto px-5 pb-5 pt-2">
          <DialogTitle className="font-display text-[24px] leading-[1.25] text-foreground">
            {t('personalAdd.title')}
          </DialogTitle>
          <p className="mt-1 text-[12.5px] font-medium text-muted-1">{t('personalAdd.subtitle')}</p>

          {/* Columna angosta para el eje de filas, y dos columnas iguales para las celdas. */}
          <div className="mt-5 grid grid-cols-[auto_1fr_1fr] items-stretch gap-x-2 gap-y-2">
            <span />
            <div className="pb-0.5 pl-1">{axisLabel(t('personalAdd.axisOnce'))}</div>
            <div className="pb-0.5 pl-1">{axisLabel(t('personalAdd.axisMonthly'))}</div>

            <div className="flex items-center pr-1">{axisLabel(t('personalAdd.axisOut'))}</div>
            {cell('expense', 'out')}
            {cell('fixed', 'out')}

            <div className="flex items-center pr-1">{axisLabel(t('personalAdd.axisIn'))}</div>
            {cell('extra', 'in')}
            {cell('salary', 'in')}
          </div>

          <p className="mt-4 text-[11.5px] font-medium leading-[1.5] text-muted-2">
            {t('personalAdd.note', { month: monthLabel })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
