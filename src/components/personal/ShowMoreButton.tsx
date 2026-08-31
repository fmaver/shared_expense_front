import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Prominent full-width "Ver más" footer that reveals more rows in place.
 * The soft top gradient hints that content continues below the last row.
 */
export function ShowMoreButton({ remaining, onClick, className }: { remaining: number; onClick: () => void; className?: string }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full mt-1.5 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-brand cursor-pointer',
        'bg-gradient-to-b from-transparent to-muted/50 hover:to-muted/80 transition-colors',
        className,
      )}
    >
      {t('personal.showMore', { count: remaining })}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}
