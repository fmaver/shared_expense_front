import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useScroll } from '@/contexts/ScrollContext';
import { Home, Users, User, Plus, ArrowLeftRight, ChevronLeft, Receipt, PieChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFabActions } from '@/contexts/FabActionsContext';
import { GroupExpenseLauncher, type LauncherMode } from './GroupExpenseLauncher';

interface LauncherState {
  open: boolean;
  mode: LauncherMode;
  presetGroupId?: number;
}

const CLOSED: LauncherState = { open: false, mode: 'expense' };

interface TabItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** Match the route exactly (index tab of the group). */
  end?: boolean;
}

export function FloatingTabBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { personalAdd } = useFabActions();
  const { tabBarCollapsed } = useScroll();

  // Detect group context from route
  const groupMatchExact = useMatch('/groups/:groupId');
  const groupMatchSub = useMatch('/groups/:groupId/*');
  const groupMatch = groupMatchExact ?? groupMatchSub;
  const parsedGroupId = groupMatch?.params?.groupId ? parseInt(groupMatch.params.groupId, 10) : null;
  const groupId = parsedGroupId !== null && Number.isFinite(parsedGroupId) ? parsedGroupId : null;
  const inGroup = groupId !== null;

  // Speed-dial open/closed
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const closeDial = useCallback(() => setSpeedDialOpen(false), []);

  // Close a dial left open across navigation
  useEffect(() => { setSpeedDialOpen(false); }, [location.pathname]);

  // Launcher state
  const [launcher, setLauncher] = useState<LauncherState>(CLOSED);
  const closeLauncher = useCallback(() => setLauncher(CLOSED), []);

  const openLauncher = useCallback((mode: LauncherMode, presetGroupId?: number) => {
    setSpeedDialOpen(false);
    setLauncher({ open: true, mode, presetGroupId });
  }, []);

  const handleFabPress = useCallback(() => {
    setSpeedDialOpen(prev => !prev);
  }, []);

  // On /personal (and its sub-pages) the first action is personal add
  const isPersonal = location.pathname.startsWith('/personal');

  // Tab set swaps with the route: global sections, or the current group's pages
  const groupBase = `/groups/${groupId}`;
  const tabs: TabItem[] = inGroup
    ? [
        { to: groupBase, icon: Receipt, label: t('tabs.expenses'), end: true },
        { to: `${groupBase}/members`, icon: Users, label: t('tabs.members') },
        { to: `${groupBase}/charts`, icon: PieChart, label: t('tabs.charts') },
        { to: `${groupBase}/settings`, icon: Settings, label: t('tabs.settings') },
      ]
    : [
        { to: '/personal', icon: Home, label: t('mobileNav.personal') },
        { to: '/groups', icon: Users, label: t('mobileNav.groups') },
        { to: '/profile', icon: User, label: t('mobileNav.profile') },
      ];

  const speedDialItems = inGroup
    ? [
        {
          icon: Plus,
          label: t('fab.addExpense'),
          onClick: () => openLauncher('expense', groupId),
        },
        {
          icon: ArrowLeftRight,
          label: t('fab.transfer'),
          onClick: () => openLauncher('transfer', groupId),
        },
      ]
    : isPersonal
    ? [
        // Personal add only works where PersonalExpensesSection is mounted
        ...(personalAdd
          ? [{
              icon: User,
              label: t('fab.personalExpense'),
              onClick: () => { closeDial(); personalAdd(); },
            }]
          : []),
        {
          icon: Plus,
          label: t('fab.groupExpense'),
          onClick: () => openLauncher('expense'),
        },
        {
          icon: ArrowLeftRight,
          label: t('fab.transfer'),
          onClick: () => openLauncher('transfer'),
        },
      ]
    : [
        {
          icon: Plus,
          label: t('fab.addExpense'),
          onClick: () => openLauncher('expense'),
        },
        {
          icon: ArrowLeftRight,
          label: t('fab.transfer'),
          onClick: () => openLauncher('transfer'),
        },
      ];

  // Expanded item width: the 5-element group set (back + 4 tabs) uses w-10 so the
  // pill clears the FAB (right-5 + w-14 = 4.75rem) even at 320px wide screens.
  const expandedItemWidth = inGroup ? 'w-10' : 'w-14';

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
        aria-label={t('fab.options')}
      >
        <Plus
          className={cn(
            'h-6 w-6 transition-transform duration-200',
            speedDialOpen && 'rotate-45',
          )}
        />
      </button>

      {/* Floating Tab Bar — collapses to active tab + slides to bottom-left on scroll.
          Expand sequence: tabs widen first (220ms), then nav slides to centre (200ms delay=220ms).
          This keeps the `50%` in calc(50vw - 50%) stable when the translate starts, preventing
          the overshoot/rebound caused by a moving target mid-animation.
          Collapse: translate + tab-shrink happen simultaneously (feels snappy).
          Inside a group the pill swaps to back-chevron + group tabs and centres in the
          space left of the FAB. */}
      <nav
        className="fixed z-40 lg:hidden"
        style={{
          bottom: `calc(1rem + env(safe-area-inset-bottom))`,
          left: 0,
          transform: tabBarCollapsed
            ? 'translateX(1rem)'
            : inGroup
              ? 'translateX(calc((100vw - 4.75rem) / 2 - 50%))'
              : 'translateX(calc(50vw - 50%))',
          transition: tabBarCollapsed
            ? 'transform 200ms ease-in'
            : 'transform 200ms ease-out 220ms',
        }}
      >
        <div
          className="liquid-glass relative flex items-center rounded-full overflow-hidden"
          style={{
            padding: tabBarCollapsed ? '4px' : '8px',
            transition: tabBarCollapsed
              ? 'padding 200ms ease-in'
              : 'padding 200ms ease-out 220ms',
          }}
        >
          {/* Top specular highlight — simulates light catching the top edge of thick glass */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] z-10 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.60) 28%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.60) 72%, transparent 96%)',
            }}
          />
          {/* Keyed wrapper remounts on mode swap and plays the tabset-in fade */}
          <div
            key={inGroup ? 'group' : 'global'}
            className="flex items-center animate-tabset-in"
            style={{
              gap: tabBarCollapsed ? '0px' : '4px',
              transition: tabBarCollapsed
                ? 'gap 200ms ease-in'
                : 'gap 220ms ease-out',
            }}
          >
            {inGroup && (
              <Link
                to="/groups"
                aria-label={t('mobileNav.backToGroups')}
                style={{
                  transition: tabBarCollapsed
                    ? 'width 200ms ease-in, opacity 180ms ease-in'
                    : 'width 220ms ease-out, opacity 200ms ease-out',
                }}
                className={cn(
                  'flex items-center justify-center h-10 rounded-full overflow-hidden',
                  'text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10',
                  tabBarCollapsed ? 'w-0 opacity-0 pointer-events-none' : `${expandedItemWidth} opacity-100`,
                )}
              >
                <ChevronLeft className="h-5 w-5 shrink-0" />
              </Link>
            )}
            {tabs.map(({ to, icon: Icon, label, end }) => {
              const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  style={{
                    transition: tabBarCollapsed
                      ? 'width 200ms ease-in, opacity 180ms ease-in'
                      : 'width 220ms ease-out, opacity 200ms ease-out',
                  }}
                  className={cn(
                    'relative flex flex-col items-center justify-center h-10 rounded-full overflow-hidden',
                    isActive
                      ? 'text-brand bg-white/30 dark:bg-white/15'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10',
                    tabBarCollapsed
                      ? isActive ? 'w-10 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                      : `${expandedItemWidth} opacity-100`,
                  )}
                  aria-label={label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </NavLink>
              );
            })}
          </div>
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
