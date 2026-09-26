import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * "Ver N más ▾": un link de texto, no un botón, que despliega el resto de la lista en la
 * misma página (ADDENDUM-violeta.md §3). Quien lo usa le pasa `showAll`, así el número que
 * dice es exactamente lo que aparece.
 */
export function ShowMoreButton({ remaining, onClick, className }: { remaining: number; onClick: () => void; className?: string }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 pt-2.5 text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70',
        className,
      )}
    >
      {t('personal.showMore', { count: remaining })}
      <span className="text-[10px]" aria-hidden="true">▾</span>
    </button>
  );
}
