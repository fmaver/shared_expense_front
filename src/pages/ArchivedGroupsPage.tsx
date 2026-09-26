import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, FileDown, RotateCcw } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { unarchiveGroup } from '@/api/groups';
import { downloadGroupPdf } from '@/api/shares';
import { Skeleton } from '@/components/ui/skeleton';
import { avatarBg, initials } from '@/utils/avatar';
import { cn } from '@/lib/utils';
import { FloatingTopBar, TopBarSpacer } from '@/components/layout/FloatingTopBar';

/**
 * Los grupos que archivaste.
 *
 * Archivar es por persona, así que esta lista no dice nada del resto: el mismo grupo puede
 * estar archivado acá y perfectamente activo para los demás. Y como el backend sólo deja
 * archivar con las cuentas en cero, acá nunca hay plata pendiente — la nota al pie lo dice.
 */
export function ArchivedGroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: groups = [], isLoading, error, refetch } = useGroups(true);

  const handleUnarchive = async (groupId: number) => {
    try {
      await unarchiveGroup(groupId);
      toast.success(t('groups.unarchivedToast'));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unarchive group');
    }
  };

  const handlePdf = async (groupId: number, groupName: string) => {
    try {
      await downloadGroupPdf(groupId, groupName);
    } catch {
      toast.error(t('toasts.failedExport'));
    }
  };

  const formatYear = (iso?: string | null) =>
    iso ? new Date(iso).getFullYear().toString() : null;

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      <FloatingTopBar back={{ to: '/groups', label: t('mobileNav.groups') }} />
      <TopBarSpacer />
      <Link
        to="/groups"
        className="hidden lg:inline-flex items-center gap-0.5 text-[12px] font-semibold text-muted-2 transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('mobileNav.groups')}
      </Link>
      <h1 className="mt-1.5 text-[22px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">
        {t('groups.archivedTitle')}
      </h1>

      {error && (
        <p className="mt-4 rounded-card border border-negative-wash-line bg-negative-wash px-4 py-3 text-[12.5px] font-semibold text-negative-ink">
          {t('groups.failedToFetch')}
        </p>
      )}

      <div className="mt-5 space-y-2">
        {isLoading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-card" />)
        ) : groups.length === 0 ? (
          <p className="py-10 text-center text-[12.5px] text-muted-2">{t('groups.noArchived')}</p>
        ) : (
          groups.map(group => {
            const since = formatYear(group.createdAt);
            return (
              <div key={group.id} className="rounded-card bg-surface-sunken p-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-[34px] w-[34px] shrink-0 select-none items-center justify-center rounded-[11px] text-[12px] font-bold text-white opacity-70',
                    avatarBg(group.id),
                  )}>
                    {initials(group.name)}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <span className="block truncate text-[13.5px] font-bold text-muted-1">
                      {group.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] font-medium text-muted-2">
                      {t('groups.peopleCount', { count: group.members.length })}
                      {since && <> · {since}</>}
                    </span>
                  </button>
                  <span className="shrink-0 rounded-pill bg-positive-wash px-2.5 py-1 text-[11px] font-bold text-positive">
                    {t('groups.inZero')}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePdf(group.id, group.name)}
                    className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-pill border border-line-strong text-[12px] font-bold text-muted-1 transition-colors hover:bg-surface"
                  >
                    <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnarchive(group.id)}
                    className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-pill bg-primary text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('groups.unarchive')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-[11.5px] font-medium leading-[1.45] text-muted-2">
        {t('groups.archivedNote')}
      </p>
    </div>
  );
}
