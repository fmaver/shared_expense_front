import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { getDueDates } from '@/api/dueDates';
import type { DueDate } from '@/types/expense';

const PREVIEW_LIMIT = 3;

/**
 * Los vencimientos personales, dentro del dashboard personal.
 *
 * Vive acá y no en la barra de navegación global a propósito: ahí quedaba un ícono de
 * calendario entre "Personal", "Grupos" y "Configuración", sin nada que dijera que esos
 * vencimientos eran los tuyos y no los de un grupo. Dentro de la pantalla personal el
 * contexto lo da el lugar.
 */
export function DueDatesSection({ groupId }: { groupId: number }) {
  const { t, i18n } = useTranslation();
  const [dueDates, setDueDates] = useState<DueDate[]>([]);

  useEffect(() => {
    let cancelled = false;
    getDueDates(groupId)
      .then((rows) => {
        if (!cancelled) setDueDates(rows);
      })
      .catch(() => {
        /* la sección es informativa: si falla, no vale un toast en el dashboard */
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const today = new Date();

  const nextOccurrence = (d: DueDate): Date => {
    const anchor = d.anchorYear * 12 + d.anchorMonth;
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    for (let i = 0; i < 14 + d.everyNMonths; i += 1) {
      const offset = year * 12 + month - anchor;
      if (offset >= 0 && offset % d.everyNMonths === 0) {
        const lastDay = new Date(year, month, 0).getDate();
        const candidate = new Date(year, month - 1, Math.min(d.dayOfMonth, lastDay));
        if (candidate >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) return candidate;
      }
      month += 1;
      if (month === 13) {
        year += 1;
        month = 1;
      }
    }
    return today;
  };

  const upcoming = [...dueDates]
    .sort((a, b) => nextOccurrence(a).getTime() - nextOccurrence(b).getTime())
    .slice(0, PREVIEW_LIMIT);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 min-w-0">
          <CalendarClock className="h-4 w-4 text-brand shrink-0" />
          <span className="truncate">{t('dueDates.personalTitle')}</span>
        </h2>
        <Link
          to="/personal/due-dates"
          className="text-xs text-brand hover:underline flex items-center gap-0.5 shrink-0"
        >
          {t('dueDates.manage')}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('dueDates.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-foreground">{d.label}</span>
              <span className="text-muted-foreground shrink-0">
                {nextOccurrence(d).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-AR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
