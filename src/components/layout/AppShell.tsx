import React, { useState, useCallback } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { useScroll } from '@/contexts/ScrollContext';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { FloatingTabBar } from './FloatingTabBar';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useGroup } from '@/hooks/useGroups';
import { useIsland } from '@/contexts/IslandContext';
import type { Group } from '@/types/expense';

interface AppShellProps {
  onLogout: () => void;
}

export function AppShell({ onLogout }: AppShellProps) {
  const navigate = useNavigate();
  const [openNewGroup, setOpenNewGroup] = useState(false);
  const { state: islandState } = useIsland();
  const { notifyScroll } = useScroll();
  const handleMainScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    notifyScroll((e.target as HTMLElement).scrollTop);
  }, [notifyScroll]);

  // Detect if we're inside a group route to show group name in the island
  const groupMatchExact = useMatch('/groups/:groupId');
  const groupMatchSub = useMatch('/groups/:groupId/*');
  const groupMatch = groupMatchExact ?? groupMatchSub;
  const groupIdParam = groupMatch?.params?.groupId
    ? parseInt(groupMatch.params.groupId, 10)
    : null;

  const { data: group } = useGroup(groupIdParam ?? 0);
  const groupName = groupIdParam !== null ? (group?.name ?? undefined) : undefined;

  // Derive the effective island display state
  const effectiveIslandState: 'idle' | 'loading' | 'success' | 'group' =
    islandState !== 'idle'
      ? islandState
      : groupIdParam !== null
        ? 'group'
        : 'idle';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-56 overflow-hidden">
        <Sidebar onLogout={onLogout} onNewGroup={() => setOpenNewGroup(true)} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header (replaces TopBar on mobile) */}
        <MobileHeader
          onLogout={onLogout}
          state={effectiveIslandState}
          groupName={groupName}
        />

        {/* Main content — flex col so GroupLayout can flex-1 without overflowing */}
        <main
          className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden touch-pan-y pb-24 lg:pb-0 pt-12 lg:pt-0"
          onScroll={handleMainScroll}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile floating tab bar + FAB */}
      <FloatingTabBar />

      <CreateGroupDialog
        open={openNewGroup}
        onOpenChange={setOpenNewGroup}
        onCreated={(g: Group) => navigate(`/groups/${g.id}`)}
      />
    </div>
  );
}
