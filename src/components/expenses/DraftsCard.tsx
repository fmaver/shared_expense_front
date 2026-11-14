import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDrafts } from '@/hooks/useDrafts';
import { relativeAge } from '@/utils/format';

/**
 * "N gastos para revisar" — arriba del inicio mientras haya borradores de la carga rápida.
 *
 * Es la entrada a `/drafts` cuando no llegó (o no se tocó) el push. Sin pendientes no dibuja
 * nada: no hay un lugar vacío que diga "no tenés borradores".
 */
export function DraftsCard({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { drafts } = useDrafts();

  if (drafts.length === 0) return null;

  const oldest = drafts.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
  const age = relativeAge(oldest.createdAt, i18n.language);

  return (
    <div className={cn('flex items-center gap-3 rounded-card border border-brand-wash-line bg-brand-wash p-4', className)}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-brand-ink">
          {t('drafts.cardTitle', { count: drafts.length })}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] font-medium text-brand-ink/75">
          {t(drafts.length === 1 ? 'drafts.cardAgeSingle' : 'drafts.cardAgeOldest', { age })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/drafts')}
        className="flex h-9 shrink-0 cursor-pointer items-center rounded-pill bg-primary px-4 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t('drafts.review')}
      </button>
    </div>
  );
}
