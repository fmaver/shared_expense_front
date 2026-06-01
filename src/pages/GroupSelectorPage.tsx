import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/hooks/useGroups';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Plus, Users, User } from 'lucide-react';
import type { Group } from '@/types/expense';

export function GroupSelectorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { data: groups = [], isLoading, error } = useGroups();
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === '1');

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">{t('groups.yourGroups')}</h1>
        <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> {t('groups.newGroup')}
        </Button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">{t('groups.failedToFetch')}</div>}

      {/* Personal Finance section */}
      <div className="mb-6">
        <button onClick={() => navigate('/personal')}
          className="w-full bg-card border border-brand/20 rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-brand/50 hover:bg-accent/50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
              <User className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{t('personal.title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('personal.subtitle')}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">{t('groups.noGroups')}</p>
          <Button className="bg-brand hover:bg-brand/90 text-white" onClick={() => setShowCreate(true)}>
            {t('groups.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(group => (
            <button key={group.id} onClick={() => navigate(`/groups/${group.id}`)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-brand/40 hover:bg-accent/50 transition-colors text-left">
              <div>
                <p className="font-semibold text-foreground text-sm">{group.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('groups.memberCount', { count: group.members.length })}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <CreateGroupDialog open={showCreate} onOpenChange={setShowCreate}
        onCreated={(g: Group) => navigate(`/groups/${g.id}`)} />
    </div>
  );
}
