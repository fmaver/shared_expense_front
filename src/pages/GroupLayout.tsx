import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useGroup } from '@/hooks/useGroups';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = [
  { label: 'Expenses', path: '' },
  { label: 'Members',  path: 'members' },
  { label: 'Settings', path: 'settings' },
];

export function GroupLayout() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { data: group, isLoading } = useGroup(groupId);

  return (
    <div className="flex flex-col h-full">
      {/* Group header + tabs */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 pt-4 pb-0">
          {isLoading ? (
            <Skeleton className="h-6 w-40 mb-3" />
          ) : (
            <h2 className="text-lg font-bold text-foreground mb-3">{group?.name}</h2>
          )}
          <nav className="-mb-px flex gap-0">
            {TABS.map(tab => (
              <NavLink
                key={tab.label}
                to={tab.path === '' ? `/groups/${groupId}` : `/groups/${groupId}/${tab.path}`}
                end={tab.path === ''}
                className={({ isActive }) => cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
