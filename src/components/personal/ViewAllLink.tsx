import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

/** iOS-style "View all (N) ›" affordance used in section headers. */
export function ViewAllLink({ to, count }: { to: string; count: number }) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-brand transition-colors shrink-0"
    >
      {t('personal.viewAll', { total: count })}
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}
