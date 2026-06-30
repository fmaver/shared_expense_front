import React, { useCallback } from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroup } from '@/hooks/useGroups';
import { useScroll } from '@/contexts/ScrollContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function GroupLayout() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { data: group, isLoading } = useGroup(groupId);
  const { t } = useTranslation();
  const { isAtTop, notifyScroll } = useScroll();
  const handleInnerScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    notifyScroll((e.target as HTMLElement).scrollTop);
  }, [notifyScroll]);

  const TABS = [
    { label: t('tabs.expenses'), path: '' },
    { label: t('tabs.members'),  path: 'members' },
    { label: t('tabs.settings'), path: 'settings' },
    { label: t('tabs.charts'),   path: 'charts' },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Group header + tabs */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 pt-4 pb-0">
          {/* Large collapsing title — visible at top, collapses on scroll (mobile only) */}
          <div
            style={{ transition: 'max-height 420ms cubic-bezier(0.32,0.72,0,1), opacity 350ms ease-out, margin-bottom 420ms cubic-bezier(0.32,0.72,0,1)' }}
            className={cn(
              'overflow-hidden lg:!max-h-10 lg:!opacity-100',
              isAtTop ? 'max-h-10 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0',
            )}
          >
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <h2 className="text-lg font-bold text-foreground">{group?.name}</h2>
            )}
          </div>
          <nav className="-mb-px flex gap-0">
            {TABS.map(tab => (
              <NavLink
                key={tab.label}
                to={tab.path === '' ? `/groups/${groupId}` : `/groups/${groupId}/${tab.path}`}
                end={tab.path === ''}
                className={({ isActive }) => cn(
                  'px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors',
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onScroll={handleInnerScroll}>
        <Outlet />
      </div>
    </div>
  );
}
