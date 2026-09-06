import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createDueDate, deleteDueDate, getDueDates } from '@/api/dueDates';
import type { DueDate } from '@/types/expense';
import { useScroll } from '@/contexts/ScrollContext';

const TODAY = new Date();

export default function GroupDueDatesPage() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { t } = useTranslation();
  const { notifyScroll } = useScroll();

  const [dueDates, setDueDates] = useState<DueDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [everyNMonths, setEveryNMonths] = useState(1);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);

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

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!label.trim()) return;
    try {
      await createDueDate(groupId, {
        label: label.trim(),
        dayOfMonth,
        everyNMonths,
        // El ancla es el mes en curso: "cada 2 meses" cuenta desde ahora, que es lo que
        // alguien espera al cargarlo hoy.
        anchorYear: TODAY.getFullYear(),
        anchorMonth: TODAY.getMonth() + 1,
        notifyDaysBefore,
      });
      setLabel('');
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDueDate(groupId, id);
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const cadence = (d: DueDate) =>
    d.everyNMonths === 1 ? t('dueDates.monthly') : t('dueDates.everyN', { n: d.everyNMonths });

  const advance = (d: DueDate) =>
    d.notifyDaysBefore === 0
      ? t('dueDates.sameDay')
      : `${d.notifyDaysBefore} ${t('dueDates.daysBefore')}`;

  return (
    <div className="flex flex-col flex-1">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0 p-4 space-y-4"
        onScroll={(e) => notifyScroll((e.target as HTMLDivElement).scrollTop)}
      >
        <form onSubmit={handleAdd} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder={t('dueDates.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={255}
          />
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-muted-foreground">
              {t('dueDates.dayOfMonth')}
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10) || 1)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              {t('dueDates.everyNMonths')}
              <input
                type="number"
                min={1}
                max={12}
                value={everyNMonths}
                onChange={(e) => setEveryNMonths(parseInt(e.target.value, 10) || 1)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              {t('dueDates.notifyDaysBefore')}
              <input
                type="number"
                min={0}
                max={30}
                value={notifyDaysBefore}
                onChange={(e) => setNotifyDaysBefore(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground cursor-pointer"
          >
            {t('dueDates.add')}
          </button>
        </form>

        {loading ? null : dueDates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dueDates.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {dueDates.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dueDates.dayOfMonth')} {d.dayOfMonth} · {cadence(d)} · {advance(d)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="text-xs text-destructive cursor-pointer"
                >
                  {t('dueDates.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
