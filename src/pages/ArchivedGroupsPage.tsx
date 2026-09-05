import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGroups } from '@/hooks/useGroups';
import { unarchiveGroup } from '@/api/groups';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArchiveRestore, ArrowLeft, PartyPopper } from 'lucide-react';

/**
 * The groups this member has archived.
 *
 * Archiving is per member, so this list says nothing about anyone else — the same group can be
 * archived here and perfectly active for everybody else in it.
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

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/groups')} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">{t('groups.archivedTitle')}</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
          {t('groups.failedToFetch')}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t('groups.noArchived')}</p>
      ) : (
        <div className="space-y-2">
          {groups.map(group => (
            <div
              key={group.id}
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => navigate(`/groups/${group.id}`)}
                className="min-w-0 flex-1 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm truncate">{group.name}</p>
                  {group.groupType === 'one_time' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide bg-brand/10 text-brand px-1.5 py-0.5 rounded-full flex-shrink-0">
                      <PartyPopper className="h-3 w-3" />
                      {t('groups.badgeOneTime')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('groups.memberCount', { count: group.members.length })}
                </p>
              </button>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer flex-shrink-0"
                onClick={() => handleUnarchive(group.id)}
              >
                <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />
                {t('groups.unarchive')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
