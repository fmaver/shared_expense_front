import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useScroll } from '@/contexts/ScrollContext';
import {
  ArrowLeftRight, Camera, PenLine, PieChart, Plus, User, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFabActions } from '@/contexts/FabActionsContext';
import { useSettlementState } from '@/contexts/SettlementContext';
import { GroupExpenseLauncher, type LauncherMode } from './GroupExpenseLauncher';
import { useScanPicker } from '@/components/expenses/ScanPicker';

/** Cuánto hay que mantener apretado el "+" para ir directo a la cámara. */
const LONG_PRESS_MS = 500;

interface LauncherState {
  open: boolean;
  mode: LauncherMode;
  presetGroupId?: number;
  scanFile?: File | null;
}

const CLOSED: LauncherState = { open: false, mode: 'expense' };

interface TabItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}

export function FloatingTabBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { personalActions } = useFabActions();
  const { tabBarCollapsed } = useScroll();
  const { isSettled: viewedMonthSettled } = useSettlementState();

  // Detect group context from route
  const groupMatchExact = useMatch('/groups/:groupId');
  const groupMatchSub = useMatch('/groups/:groupId/*');
  const groupMatch = groupMatchExact ?? groupMatchSub;
  const parsedGroupId = groupMatch?.params?.groupId ? parseInt(groupMatch.params.groupId, 10) : null;
  const groupId = parsedGroupId !== null && Number.isFinite(parsedGroupId) && parsedGroupId > 0 ? parsedGroupId : null;
  const inGroup = groupId !== null;

  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const closeDial = useCallback(() => setSpeedDialOpen(false), []);

  // Close a dial left open across navigation
  useEffect(() => { setSpeedDialOpen(false); }, [location.pathname]);

  const [launcher, setLauncher] = useState<LauncherState>(CLOSED);
  const closeLauncher = useCallback(() => setLauncher(CLOSED), []);

  const openLauncher = useCallback((mode: LauncherMode, presetGroupId?: number, scanFile?: File) => {
    setSpeedDialOpen(false);
    setLauncher({ open: true, mode, presetGroupId, scanFile: scanFile ?? null });
  }, []);

  /* Escanear: la foto elegida abre la hoja del gasto leyéndola (V6.6). */
  const scanPicker = useScanPicker(file => openLauncher('expense', groupId ?? undefined, file));

  const isPersonal = location.pathname === '/personal' || location.pathname.startsWith('/personal/');

  /*
    Tres destinos, y ninguno es el perfil: la barra es para lo que se mira seguido, y al perfil
    se llega por el avatar del header. Adentro de un grupo la pastilla no se dibuja — el grupo
    tiene su propio encabezado con sus pestañas, y "‹ Grupos" es la salida (§6.3).
  */
  const tabs: TabItem[] = [
    { to: '/personal', icon: User, label: t('mobileNav.personal'), end: true },
    { to: '/groups', icon: Users, label: t('mobileNav.groups') },
    { to: '/personal/charts', icon: PieChart, label: t('mobileNav.numbers') },
  ];

  /*
    Tres caminos en el "+" (V6.6): cargar a mano, escanear un ticket y la transferencia, que
    el diseño no dibuja pero la sección 7 del README exige conservar acá. Va en una fila más
    liviana porque se usa mucho menos. En lo personal el "+" abre su propio panel.
  */
  const scanItem = {
    icon: Camera,
    label: t('scan.menuTitle'),
    desc: t('scan.menuDesc'),
    tone: 'scan' as const,
    onClick: () => { setSpeedDialOpen(false); scanPicker.pickAny(); },
  };
  const menuItems = isPersonal && !inGroup
    ? []
    : [
        {
          icon: PenLine,
          label: t('fab.addByHand'),
          desc: t('fab.addExpenseDesc'),
          tone: 'brand' as const,
          onClick: () => openLauncher('expense', groupId ?? undefined),
        },
        scanItem,
        {
          icon: ArrowLeftRight,
          label: t('fab.transfer'),
          desc: t('fab.transferDesc'),
          tone: 'light' as const,
          onClick: () => openLauncher('transfer', groupId ?? undefined),
        },
      ];

  /*
    Mantener apretado el "+" va directo a la cámara. Se decide al soltar y no con un timer:
    iOS sólo abre el selector de archivos desde el toque mismo, y el `pointerup` lo es.
  */
  const pressStart = useRef<number | null>(null);
  const longPressed = useRef(false);
  const onFabPointerDown = () => { pressStart.current = performance.now(); longPressed.current = false; };
  const onFabPointerUp = () => {
    const start = pressStart.current;
    pressStart.current = null;
    if (start === null || performance.now() - start < LONG_PRESS_MS) return;
    longPressed.current = true;
    setSpeedDialOpen(false);
    if (isPersonal && !inGroup) personalActions?.scanWithCamera();
    else scanPicker.pickCamera();
  };
  const onFabPointerCancel = () => { pressStart.current = null; };

  return (
    <>
      {/* Dismiss overlay for speed-dial */}
      {speedDialOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={closeDial} aria-hidden="true" />
      )}

      {/* Action menu — panel escalando desde el FAB */}
      <div
        className={cn(
          'fixed right-5 z-40 w-80 max-w-[calc(100vw-2.5rem)] lg:hidden',
          'glass rounded-2xl p-2',
          'origin-bottom-right transition-all duration-200 ease-out',
          speedDialOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0',
        )}
        style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/20 active:bg-white/25 dark:hover:bg-white/10 dark:active:bg-white/15"
            >
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg',
                  item.tone === 'light' ? 'h-8 w-8 bg-surface-sunken/70 text-muted-1' : 'h-10 w-10',
                  item.tone === 'brand' && 'bg-brand/15 text-brand',
                  item.tone === 'scan' && 'bg-surface-sunken text-brand-ink',
                )}
              >
                <Icon className={item.tone === 'light' ? 'h-4 w-4' : 'h-5 w-5'} />
              </span>
              <span className="min-w-0">
                <span className={cn('block font-semibold', item.tone === 'light' ? 'text-[13px] text-muted-1' : 'text-sm text-foreground')}>
                  {item.label}
                </span>
                {item.desc && item.tone !== 'light' && (
                  <span className="block truncate text-xs text-muted-1">{item.desc}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/*
        Pastilla y FAB en una sola fila centrada: el "+" va al lado, no encima (§6.1).
        Al scrollear la pastilla se encoge al tab activo y el FAB no se mueve.
      */}
      <div
        className={cn(
          'fixed inset-x-0 z-40 flex items-center gap-2.5 lg:hidden',
          // Con pastilla, el conjunto va centrado; adentro de un grupo no hay pastilla y el
          // "+" solo se va al borde, que es donde el pulgar lo espera.
          inGroup ? 'justify-end pr-5' : 'justify-center',
        )}
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {!inGroup && (
          <nav
            className="glass relative flex items-center overflow-hidden rounded-full"
            style={{
              padding: tabBarCollapsed ? '4px' : '8px',
              transition: 'padding 220ms ease-out',
            }}
          >
            {/* Reflejo especular del borde superior del vidrio */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[1.5px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.60) 28%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.60) 72%, transparent 96%)',
              }}
            />
            <div
              className="flex items-center"
              style={{ gap: tabBarCollapsed ? '0px' : '4px', transition: 'gap 220ms ease-out' }}
            >
              {tabs.map(({ to, icon: Icon, label, end }) => {
                const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    aria-label={label}
                    style={{ transition: 'width 220ms ease-out, opacity 200ms ease-out' }}
                    className={cn(
                      'relative flex h-10 items-center justify-center overflow-hidden rounded-full',
                      isActive
                        ? 'bg-surface-sunken text-brand-ink'
                        : 'text-muted-1 hover:bg-surface-sunken/60 hover:text-foreground',
                      tabBarCollapsed
                        ? isActive ? 'w-10 opacity-100' : 'pointer-events-none w-0 opacity-0'
                        : 'w-14 opacity-100',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </NavLink>
                );
              })}
            </div>
          </nav>
        )}

        {/*
          En un mes cerrado el "+" se apaga: no está prohibido cargar, pero lo que cargues cae
          en el mes que estás viendo, y ese ya está saldado. La nota lo dice en palabras en vez
          de deshabilitar el botón sin explicación (principio 4).
        */}
        <div className="relative shrink-0">
          {viewedMonthSettled && inGroup && (
            <span className="glass absolute bottom-[3.75rem] right-0 w-44 rounded-2xl px-3 py-2 text-[10.5px] font-semibold leading-[1.4] text-muted-1">
              {t('settle.fabNote')}
            </span>
          )}
          <button
            type="button"
            onPointerDown={onFabPointerDown}
            onPointerUp={onFabPointerUp}
            onPointerCancel={onFabPointerCancel}
            onPointerLeave={onFabPointerCancel}
            onContextMenu={e => e.preventDefault()}
            onClick={() => {
              // El click llega después del pointerup: si fue un toque largo, ya se escaneó.
              if (longPressed.current) { longPressed.current = false; return; }
              if (isPersonal) { closeDial(); personalActions?.openMatrix(); return; }
              setSpeedDialOpen(prev => !prev);
            }}
            aria-label={t('fab.options')}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              'cursor-pointer transition-transform duration-150 active:scale-95',
              viewedMonthSettled && inGroup
                ? 'bg-surface-sunken text-muted-3'
                : 'bg-primary text-primary-foreground shadow-fab',
            )}
          >
            <Plus className={cn('h-6 w-6 transition-transform duration-200', speedDialOpen && 'rotate-45')} />
          </button>
        </div>
      </div>

      {/* Group expense launcher (dialogs) */}
      <GroupExpenseLauncher
        open={launcher.open}
        onClose={closeLauncher}
        mode={launcher.mode}
        presetGroupId={launcher.presetGroupId}
        scanFile={launcher.scanFile}
      />
      {scanPicker.inputs}
    </>
  );
}
