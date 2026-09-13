import React, { useState, useCallback } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useScroll } from '@/contexts/ScrollContext';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { FloatingTabBar } from './FloatingTabBar';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useGroup } from '@/hooks/useGroups';
import { useIsland } from '@/contexts/IslandContext';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/expense';

interface AppShellProps {
  onLogout: () => void;
}

export function AppShell({ onLogout }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
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

  const inGroup = groupIdParam !== null;
  /*
    Pantallas que traen su propio encabezado y no quieren el de la app encima: el grupo (nombre,
    gente y pestañas) y todo lo personal (el saludo con el mes y el avatar). Dos barras
    apiladas con dos avatares es exactamente lo que el rediseño saca de encima.
  */
  const ownsItsHeader = inGroup
    || location.pathname.startsWith('/personal')
    || location.pathname.startsWith('/profile')
    || location.pathname.startsWith('/groups');

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
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-[248px] overflow-hidden">
        <Sidebar onLogout={onLogout} onNewGroup={() => setOpenNewGroup(true)} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/*
          Adentro de un grupo el header de la app no se dibuja: el grupo trae su propio
          encabezado persistente con el nombre, la gente y las pestañas, y "‹ Grupos" es la
          salida (§6.3). Dos barras apiladas diciendo lo mismo era lo que el rediseño saca.
        */}
        {!ownsItsHeader && (
          <MobileHeader
            onLogout={onLogout}
            state={effectiveIslandState}
            groupName={groupName}
          />
        )}

        {/* Main content — flex col so GroupLayout can flex-1 without overflowing */}
        <main
          className={cn(
            'flex flex-1 flex-col overflow-y-auto overflow-x-hidden touch-pan-y pb-24 lg:pb-0 lg:pt-0',
            ownsItsHeader ? 'pt-0' : 'pt-12',
          )}
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
