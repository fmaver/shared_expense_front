import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Archive, CalendarClock, ChevronRight, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PushCard } from '@/components/ui/PushCard';
import { useGroup } from '@/hooks/useGroups';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useSettlementState } from '@/contexts/SettlementContext';
import { archiveGroup, leaveGroup, updateGroupName } from '@/api/groups';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

export function GroupSettingsPage() {
  const { t } = useTranslation();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const navigate = useNavigate();

  const { year, month } = useMonthSearchParams();
  const { data: group, isLoading } = useGroup(groupId);
  const groupTypeKnown = !isLoading && group !== undefined;
  const isOneTime = group?.groupType === 'one_time';
  const { data: monthlyData } = useMonthlyBalance(groupId, year, month, isOneTime, groupTypeKnown);
  const currentMember = useCurrentMember();

  const { setViewedMonthState } = useSettlementState();
  useEffect(() => {
    setViewedMonthState({
      isSettled: monthlyData?.isSettled ?? false,
      yourBalance: currentMember && monthlyData
        ? (monthlyData.balances[String(currentMember.id)] ?? 0)
        : null,
    });
    return () => setViewedMonthState({ isSettled: false, yourBalance: null });
  }, [monthlyData, currentMember, setViewedMonthState]);

  const [name, setName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  /*
    El rechazo del servidor se muestra en la tarjeta y no como toast: es la explicación de por
    qué la acción no salió, y un toast que se va en tres segundos no es una explicación.
  */
  const [actionError, setActionError] = useState<string | null>(null);

  /*
    Lo que el front sabe del saldo es el del mes que estás viendo. El backend rechaza archivar
    o salir mientras quede algo abierto en CUALQUIER mes, y no hay endpoint que pregunte eso,
    así que el botón queda habilitado siempre: cuando conocemos un saldo distinto de cero lo
    decimos de antemano, y si el servidor rechaza, el mensaje aparece acá.
  */
  const yourBalance = currentMember && monthlyData
    ? (monthlyData.balances[String(currentMember.id)] ?? 0)
    : 0;
  const hasOpenBalance = Math.abs(yourBalance) > 0.01;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsRenaming(true);
    try {
      await updateGroupName(groupId, name.trim());
      toast.success(t('toasts.groupRenamed'));
      setName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename group');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    setActionError(null);
    try {
      await archiveGroup(groupId);
      toast.success(t('groups.archivedToast'));
      navigate('/groups');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('groups.archiveBlocked'));
      setIsArchiving(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    setActionError(null);
    try {
      await leaveGroup(groupId);
      toast.success(t('toasts.leftGroup'));
      navigate('/');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to leave group');
      setIsLeaving(false);
    }
  };

  /** La razón por la que archivar o salir puede no salir, dicha antes de intentarlo. */
  const blockedReason = hasOpenBalance ? (
    <p className="flex items-start gap-1.5 text-[11.5px] font-medium leading-[1.45] text-muted-1">
      <AlertCircle className="mt-px h-3 w-3 shrink-0 text-muted-2" aria-hidden="true" />
      <span>
        <Trans
          i18nKey={yourBalance > 0 ? 'settings.blockedOwed' : 'settings.blockedOwing'}
          values={{ amount: formatCurrency(Math.abs(yourBalance)) }}
          components={{
            1: <Link
                 to={`/groups/${groupId}/members?year=${year}&month=${month}`}
                 className="font-bold text-brand-ink hover:underline"
               />,
          }}
        />
      </span>
    </p>
  ) : null;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-3 px-5 py-4 lg:px-7 lg:py-6">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 px-5 py-4 lg:px-7 lg:py-6">
      {/* ── Nombre ──────────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleRename} className="rounded-card border border-line bg-surface p-4 shadow-card">
        <label htmlFor="group-name" className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
          {t('settings.groupNameRow')}
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            id="group-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={group?.name}
            className="h-10 flex-1 text-[13px]"
          />
          <button
            type="submit"
            disabled={isRenaming || !name.trim()}
            className="h-10 shrink-0 cursor-pointer rounded-[12px] bg-ink px-4 text-[12.5px] font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-paper dark:text-ink"
          >
            {isRenaming ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </form>

      {/* ── Vencimientos del grupo ──────────────────────────────────────────────────── */}
      <Link
        to={`/groups/${groupId}/due-dates`}
        className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:bg-surface-sunken"
      >
        <CalendarClock className="h-4 w-4 shrink-0 text-muted-1" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-foreground">{t('settings.dueDatesRow')}</span>
          <span className="block text-[11.5px] font-medium text-muted-2">{t('settings.dueDatesRowHint')}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-3" aria-hidden="true" />
      </Link>

      {/* ── Permiso de notificaciones ───────────────────────────────────────────────── */}
      <PushCard />

      {/* ── Archivar ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="text-[13px] font-bold text-foreground">{t('groups.archive')}</h2>
        <p className="mt-1 text-[11.5px] font-medium leading-[1.45] text-muted-2">
          {t('settings.archiveHint2')}
        </p>
        <button
          type="button"
          disabled={isArchiving}
          onClick={handleArchive}
          className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-line-strong text-[12.5px] font-bold text-foreground transition-colors hover:bg-surface-sunken disabled:opacity-50"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          {t('groups.archive')}
        </button>
      </div>

      {/* ── Salir ───────────────────────────────────────────────────────────────────── */}
      <div className="rounded-card border border-line bg-surface p-4 shadow-card">
        <button
          type="button"
          disabled={isLeaving}
          onClick={handleLeave}
          className={cn(
            'flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px]',
            'text-[12.5px] font-bold text-muted-3 transition-colors hover:bg-surface-sunken hover:text-muted-1',
            'disabled:opacity-50',
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isLeaving ? t('members.leaving') : t('members.leaveGroup')}
        </button>
        {blockedReason && (
          <div className="mt-3 border-t border-line pt-3">{blockedReason}</div>
        )}
      </div>

      {/* El servidor conoce todos los meses; si rechaza, su razón se queda a la vista. */}
      {actionError && (
        <p className="rounded-card border border-negative-wash-line bg-negative-wash px-4 py-3 text-[12px] font-semibold leading-[1.45] text-negative-ink">
          {actionError}
        </p>
      )}
    </div>
  );
}
