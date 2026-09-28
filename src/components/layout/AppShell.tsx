import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useScroll } from '@/contexts/ScrollContext';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { FloatingTabBar } from './FloatingTabBar';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useGroup } from '@/hooks/useGroups';
import { useIsland } from '@/contexts/IslandContext';
import { useSearch } from '@/contexts/SearchContext';
import { SearchOverlay } from '@/components/search/SearchOverlay';
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

  const { data: group } = useGroup(groupIdParam ?? 0);
  const groupName = groupIdParam !== null ? (group?.name ?? undefined) : undefined;

  const { openSearch } = useSearch();

  /* ⌘K / Ctrl+K abre la búsqueda, con el alcance de donde estás (V6.5). */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      openSearch(inGroup && groupIdParam !== null ? { groupId: groupIdParam, groupName: groupName ?? '' } : undefined);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch, inGroup, groupIdParam, groupName]);
  /*
    Pantallas que traen su propio encabezado y no quieren el de la app encima: el grupo (nombre,
    gente y pestañas) y todo lo personal (el saludo con el mes y el avatar). Dos barras
    apiladas con dos avatares es exactamente lo que el rediseño saca de encima.
  */
  /*
    Qué pantallas llevan la barra de la app.
    La mayoría trae su propio encabezado —el grupo con su nombre y pestañas, el home personal
    con el saludo y el avatar, las de detalle con su "‹ Volver"—. Las que no son los dos
    destinos de la barra de tabs que no tienen dónde poner el avatar, y ahí la barra es la
    única puerta al perfil.
  */
  const showsAppHeader = !inGroup
    && (location.pathname === '/groups' || location.pathname === '/personal/charts');

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
        {showsAppHeader && (
          <MobileHeader state={effectiveIslandState} groupName={groupName} />
        )}

        {/* Main content — flex col so GroupLayout can flex-1 without overflowing */}
        <main
          className={cn(
            'flex flex-1 flex-col overflow-y-auto overflow-x-hidden touch-pan-y pb-tabbar lg:pb-0 lg:pt-0',
            showsAppHeader ? 'pt-12' : 'pt-0',
          )}
          onScroll={handleMainScroll}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile floating tab bar + FAB */}
      <FloatingTabBar />

      <SearchOverlay />

      <CreateGroupDialog
        open={openNewGroup}
        onOpenChange={setOpenNewGroup}
        onCreated={(g: Group) => navigate(`/groups/${g.id}`)}
      />
    </div>
  );
}
