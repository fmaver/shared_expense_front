import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { deleteDueDate, getDueDates } from '@/api/dueDates';
import type { DueDate } from '@/types/expense';
import { useScroll } from '@/contexts/ScrollContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DueDateDialog } from '@/components/expenses/DueDateDialog';

/**
 * La misma regla que calcula las fechas en el backend, para poder mostrar el próximo
 * vencimiento sin pedirlo. Es la información que la persona quiere ver — "vence el 9 de
 * octubre" — en vez de los parámetros con los que se cargó.
 */
function nextOccurrence(d: DueDate, from: Date): Date {
  const anchor = d.anchorYear * 12 + d.anchorMonth;
  let year = from.getFullYear();
  let month = from.getMonth() + 1;

  for (let i = 0; i < 14 + d.everyNMonths; i += 1) {
    const offset = year * 12 + month - anchor;
    if (offset >= 0 && offset % d.everyNMonths === 0) {
      const lastDay = new Date(year, month, 0).getDate();
      const candidate = new Date(year, month - 1, Math.min(d.dayOfMonth, lastDay));
      if (candidate >= new Date(from.getFullYear(), from.getMonth(), from.getDate())) return candidate;
    }
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return from;
}

interface GroupDueDatesPageProps {
  /** El grupo personal no se navega como `/groups/:id`, así que se puede pasar explícito. */
  groupId?: number;
}

export default function GroupDueDatesPage({ groupId: explicitGroupId }: GroupDueDatesPageProps = {}) {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = explicitGroupId ?? parseInt(gp!, 10);
  const { t, i18n } = useTranslation();
  const { notifyScroll } = useScroll();

  const [dueDates, setDueDates] = useState<DueDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDueDates(await getDueDates(groupId));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    const previous = dueDates;
    setDueDates((current) => current.filter((d) => d.id !== id));
    try {
      await deleteDueDate(groupId, id);
    } catch (error) {
      setDueDates(previous);
      toast.error((error as Error).message);
    }
  };

  const today = useMemo(() => new Date(), []);

  // Ordenados por lo que vence antes: en una lista de vencimientos, el orden de carga no le
  // importa a nadie.
  const sorted = useMemo(
    () =>
      [...dueDates].sort(
        (a, b) => nextOccurrence(a, today).getTime() - nextOccurrence(b, today).getTime(),
      ),
    [dueDates, today],
  );

  const formatNext = (d: DueDate) => {
    const next = nextOccurrence(d, today);
    const days = Math.round((next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
    const date = next.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-AR', {
      day: 'numeric',
      month: 'long',
    });
    if (days === 0) return t('dueDates.dueToday', { date });
    if (days === 1) return t('dueDates.dueTomorrow', { date });
    return t('dueDates.dueIn', { date, days });
  };

  return (
    <div className="flex flex-col flex-1">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0"
        onScroll={(e) => notifyScroll((e.target as HTMLDivElement).scrollTop)}
      >
        <div className="p-4 space-y-3 max-w-2xl mx-auto w-full">
          {loading ? (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <CalendarClock className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{t('dueDates.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('dueDates.empty')}</p>
              <Button onClick={() => setAdding(true)} className="mt-5">
                <Plus className="h-4 w-4 mr-1.5" />
                {t('dueDates.add')}
              </Button>
            </div>
          ) : (
            <>
              {sorted.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{d.label}</p>
                    <p className="text-sm text-muted-foreground">{formatNext(d)}</p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">
                      {d.everyNMonths === 1 ? t('dueDates.monthly') : t('dueDates.everyN', { n: d.everyNMonths })}
                      {' · '}
                      {d.notifyDaysBefore === 0
                        ? t('dueDates.sameDay')
                        : t('dueDates.nDaysBefore', { n: d.notifyDaysBefore })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    aria-label={t('dueDates.delete')}
                    className="p-2 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
                <Plus className="h-4 w-4 mr-1.5" />
                {t('dueDates.add')}
              </Button>
            </>
          )}
        </div>
      </div>

      <DueDateDialog
        groupId={groupId}
        open={adding}
        onOpenChange={setAdding}
        onCreated={(created) => setDueDates((current) => [...current, created])}
      />
    </div>
  );
}
