import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { deleteDueDate, getDueDates } from '@/api/dueDates';
import type { DueDate } from '@/types/expense';
import { useScroll } from '@/contexts/ScrollContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DueDateDialog } from '@/components/expenses/DueDateDialog';
import { useGroup } from '@/hooks/useGroups';
import { nextDueOccurrence } from '@/utils/dueDates';
import { FloatingTopBar, TopBarSpacer } from '@/components/layout/FloatingTopBar';

interface GroupDueDatesPageProps {
  /** El grupo personal no se navega como `/groups/:id`, así que se puede pasar explícito. */
  groupId?: number;
  /** Fuera de un grupo (Vencimientos personales) la pantalla lleva el volver flotante. */
  backTo?: string;
}

export default function GroupDueDatesPage({ groupId: explicitGroupId, backTo }: GroupDueDatesPageProps = {}) {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = explicitGroupId ?? parseInt(gp!, 10);
  const { t, i18n } = useTranslation();
  const { data: group } = useGroup(groupId);
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
        (a, b) => nextDueOccurrence(a, today).getTime() - nextDueOccurrence(b, today).getTime(),
      ),
    [dueDates, today],
  );

  /** Cuántos días faltan y la fecha en palabras: lo que se lee de un vencimiento. */
  const describe = (d: DueDate) => {
    const next = nextDueOccurrence(d, today);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((next.getTime() - startOfToday.getTime()) / 86400000);
    const date = next.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-AR', {
      day: 'numeric',
      month: 'long',
    });
    const eyebrow = days === 0
      ? t('dueDates.eyebrowToday')
      : days === 1
        ? t('dueDates.eyebrowTomorrow')
        : t('dueDates.eyebrowInDays', { count: days });
    const notice = d.notifyDaysBefore === 0
      ? t('dueDates.noticeSameDay')
      : t('dueDates.noticeBefore', { count: d.notifyDaysBefore });
    // Lo que vence hoy o mañana ya no es un dato, es una urgencia.
    return { eyebrow, date, notice, urgent: days <= 1 };
  };

  return (
    <div className="flex flex-col flex-1">
      {backTo && <FloatingTopBar back={{ to: backTo, label: t('common.back') }} />}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0"
        onScroll={(e) => notifyScroll((e.target as HTMLDivElement).scrollTop)}
      >
        <div className="mx-auto w-full max-w-2xl space-y-2.5 px-5 py-4 lg:px-7 lg:py-6">
          {backTo && <TopBarSpacer />}
          {loading ? (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : sorted.length === 0 ? (
            <div className="px-1 py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken">
                <CalendarClock className="h-7 w-7 text-muted-2" aria-hidden="true" />
              </span>
              <p className="mt-4 text-[14px] font-bold text-foreground">{t('dueDates.emptyTitle')}</p>
              <p className="mx-auto mt-1.5 max-w-[32ch] text-[12.5px] font-medium leading-[1.5] text-muted-1">
                {t('dueDates.empty')}
              </p>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[14px] bg-brand text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {t('dueDates.add')}
              </button>
            </div>
          ) : (
            <>
              {sorted.map((d) => {
                const { eyebrow, date, notice, urgent } = describe(d);
                return (
                  <div
                    key={d.id}
                    className={cn(
                      'rounded-card border p-4',
                      urgent
                        ? 'border-negative-wash-line bg-negative-wash'
                        : 'border-line bg-surface shadow-card',
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          'text-[11px] font-semibold uppercase tracking-[0.14em]',
                          urgent ? 'text-negative-ink' : 'text-muted-2',
                        )}
                      >
                        {eyebrow}
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-muted-2">
                        {t(`dueDates.cadence${d.everyNMonths}`)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-start gap-2">
                      <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-foreground">
                        {d.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        aria-label={t('dueDates.delete')}
                        className="-mt-0.5 shrink-0 cursor-pointer p-1 text-muted-3 hover:text-negative"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="mt-1 text-[12px] font-medium text-muted-1">
                      {t('dueDates.dueOn', { date })} · {notice}
                    </p>
                  </div>
                );
              })}
              {/* Naranja y de ancho completo: es la única acción de la pantalla. */}
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-1 flex h-12 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[14px] bg-brand text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {t('dueDates.add')}
              </button>
            </>
          )}
        </div>
      </div>

      <DueDateDialog
        groupId={groupId}
        groupName={group?.groupType === 'personal' ? undefined : group?.name}
        open={adding}
        onOpenChange={setAdding}
        onCreated={(created) => setDueDates((current) => [...current, created])}
      />
    </div>
  );
}
