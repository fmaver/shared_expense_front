import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Plus, Users } from 'lucide-react';
import type { Group } from '@/types/expense';

export function GroupSelectorPage() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, error } = useGroups();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Your groups</h1>
        <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New group
        </Button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">You don't belong to any group yet.</p>
          <Button className="bg-brand hover:bg-brand/90 text-white" onClick={() => setShowCreate(true)}>
            Create your first group
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
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
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
