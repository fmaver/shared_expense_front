import React, { useState, useCallback } from 'react';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
import { useScroll } from '@/contexts/ScrollContext';
import { Home, Users, User, Plus, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFabActions } from '@/contexts/FabActionsContext';
import { GroupExpenseLauncher, type LauncherMode } from './GroupExpenseLauncher';

interface LauncherState {
  open: boolean;
  mode: LauncherMode;
  presetGroupId?: number;
}

const CLOSED: LauncherState = { open: false, mode: 'expense' };

export function FloatingTabBar() {
  const location = useLocation();
  const { personalAdd } = useFabActions();
  const { tabBarCollapsed } = useScroll();

  // Detect group context from route
  const groupMatchExact = useMatch('/groups/:groupId');
  const groupMatchSub = useMatch('/groups/:groupId/*');
  const groupMatch = groupMatchExact ?? groupMatchSub;
  const groupId = groupMatch?.params?.groupId ? parseInt(groupMatch.params.groupId, 10) : null;
  const inGroup = groupId !== null;

  // Speed-dial open/closed
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const closeDial = useCallback(() => setSpeedDialOpen(false), []);

  // Launcher state
  const [launcher, setLauncher] = useState<LauncherState>(CLOSED);
  const closeLauncher = useCallback(() => setLauncher(CLOSED), []);

  const openLauncher = useCallback((mode: LauncherMode, presetGroupId?: number) => {
    setSpeedDialOpen(false);
    setLauncher({ open: true, mode, presetGroupId });
  }, []);

  const handleFabPress = useCallback(() => {
    if (inGroup && groupId !== null) {
      // Inside a group — open add expense directly for this group
      openLauncher('expense', groupId);
    } else {
      // Outside a group — toggle speed-dial
      setSpeedDialOpen(prev => !prev);
    }
  }, [inGroup, groupId, openLauncher]);

  // On /personal the first action is personal add
  const isPersonal = location.pathname === '/personal';

  const TABS = [
    { to: '/personal', icon: Home, label: 'Personal' },
    { to: '/groups', icon: Users, label: 'Grupos' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  const speedDialItems = isPersonal
    ? [
        {
          icon: User,
          label: 'Gasto personal',
          onClick: () => { closeDial(); personalAdd?.(); },
        },
        {
          icon: Plus,
          label: 'Gasto grupal',
          onClick: () => openLauncher('expense'),
        },
        {
          icon: ArrowLeftRight,
          label: 'Transferencia',
          onClick: () => openLauncher('transfer'),
        },
      ]
    : [
        {
          icon: Plus,
          label: 'Agregar gasto',
          onClick: () => openLauncher('expense'),
        },
        {
          icon: ArrowLeftRight,
          label: 'Transferencia',
          onClick: () => openLauncher('transfer'),
        },
      ];

  return (
    <>
      {/* Dismiss overlay for speed-dial */}
      {speedDialOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={closeDial}
          aria-hidden="true"
        />
      )}

      {/* Speed-dial mini-FABs */}
      <div
        className={cn('fixed right-5 z-40 lg:hidden flex flex-col items-end gap-2', !speedDialOpen && 'pointer-events-none')}
        style={{ bottom: `calc(5.5rem + env(safe-area-inset-bottom))` }}>
        {speedDialItems.map((item, i) => {
          const Icon = item.icon;
          const delay = `${(speedDialItems.length - 1 - i) * 60}ms`;
          return (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2',
                'transition-all duration-200 ease-out',
                speedDialOpen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none',
              )}
              style={{ transitionDelay: speedDialOpen ? delay : '0ms' }}
            >
              <span className="text-xs font-semibold text-foreground bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-border/40">
                {item.label}
              </span>
              <button
                type="button"
                onClick={item.onClick}
                className="w-10 h-10 rounded-full bg-brand/90 text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-brand transition-colors"
              >
                <Icon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        type="button"
        onClick={handleFabPress}
        className={cn(
          'fixed right-5 z-40 lg:hidden',
          'w-14 h-14 rounded-full bg-brand text-white shadow-xl',
          'flex items-center justify-center cursor-pointer',
          'hover:bg-brand/90 active:scale-95 transition-all duration-150',
        )}
        style={{ bottom: `calc(1.25rem + env(safe-area-inset-bottom))` }}
        aria-label={inGroup ? 'Agregar gasto' : 'Opciones'}
      >
        <Plus
          className={cn(
            'h-6 w-6 transition-transform duration-200',
            speedDialOpen && 'rotate-45',
          )}
        />
      </button>

      {/* Floating Tab Bar — collapses to active tab + moves left on scroll down */}
      <nav
        className="fixed z-40 lg:hidden transition-all duration-300 ease-out"
        style={{
          bottom: `calc(1rem + env(safe-area-inset-bottom))`,
          left: tabBarCollapsed ? '1rem' : '50%',
          transform: tabBarCollapsed ? 'none' : 'translateX(-50%)',
        }}
      >
        <div className="flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 shadow-2xl px-2 py-2">
          {TABS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || (to !== '/personal' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'relative flex flex-col items-center justify-center h-10 rounded-full transition-all duration-300 ease-out overflow-hidden',
                  isActive ? 'text-brand bg-brand/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  tabBarCollapsed
                    ? isActive ? 'w-10 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                    : 'w-16 opacity-100',
                )}
                aria-label={label}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Group expense launcher (dialogs) */}
      <GroupExpenseLauncher
        open={launcher.open}
        onClose={closeLauncher}
        mode={launcher.mode}
        presetGroupId={launcher.presetGroupId}
      />
    </>
  );
}
