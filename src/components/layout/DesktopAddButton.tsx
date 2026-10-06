import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Camera, PenLine, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFabActions } from '@/contexts/FabActionsContext';
import { useScanPicker } from '@/components/expenses/ScanPicker';
import { GroupExpenseLauncher, type LauncherMode } from './GroupExpenseLauncher';

interface LauncherState {
  open: boolean;
  mode: LauncherMode;
  presetGroupId?: number;
  scanFile?: File | null;
}

const CLOSED: LauncherState = { open: false, mode: 'expense' };

/**
 * El "+" de desktop, arriba del sidebar.
 *
 * En mobile el alta vive en el "+" de la barra inferior; en desktop no había ninguno afuera de
 * un grupo: desde "Grupos" o "Mí" no se podía cargar nada. Este botón hace lo mismo que el de
 * mobile: en lo personal abre "¿Qué anotamos?" (gasto, ticket o ingreso); en el resto, un menú
 * con cargar a mano, escanear y transferencia, que adentro de un grupo va directo a ese grupo
 * y afuera pregunta adónde (Personal incluido, vía GroupExpenseLauncher).
 */
export function DesktopAddButton() {
  const { t } = useTranslation();
  const location = useLocation();
  const { personalActions } = useFabActions();

  const groupMatchExact = useMatch('/groups/:groupId');
  const groupMatchSub = useMatch('/groups/:groupId/*');
  const groupMatch = groupMatchExact ?? groupMatchSub;
  const parsed = groupMatch?.params?.groupId ? parseInt(groupMatch.params.groupId, 10) : null;
  const groupId = parsed !== null && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  const isPersonal = location.pathname === '/personal' || location.pathname.startsWith('/personal/');

  const [menuOpen, setMenuOpen] = useState(false);
  const [launcher, setLauncher] = useState<LauncherState>(CLOSED);
  const wrapRef = useRef<HTMLDivElement>(null);

  const openLauncher = useCallback((mode: LauncherMode, scanFile?: File) => {
    setMenuOpen(false);
    setLauncher({ open: true, mode, presetGroupId: groupId, scanFile: scanFile ?? null });
  }, [groupId]);

  const scanPicker = useScanPicker(file => openLauncher('expense', file));

  // Cerrar el menú al navegar, con Escape o tocando afuera.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const items = [
    { icon: PenLine, label: t('fab.addByHand'), desc: t('fab.addExpenseDesc'), onClick: () => openLauncher('expense') },
    { icon: Camera, label: t('scan.menuTitle'), desc: t('scan.menuDesc'), onClick: () => { setMenuOpen(false); scanPicker.pickAny(); } },
    { icon: ArrowLeftRight, label: t('fab.transfer'), desc: t('fab.transferDesc'), onClick: () => openLauncher('transfer') },
  ];

  return (
    <div ref={wrapRef} className="relative px-3 pb-3">
      <button
        type="button"
        onClick={() => {
          // En lo personal el panel propio ya ofrece gasto, ticket e ingreso.
          if (isPersonal && personalActions) { personalActions.openMatrix(); return; }
          setMenuOpen(o => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-brand-soft text-[13px] font-bold text-ink transition-opacity hover:opacity-90"
      >
        <Plus className={cn('h-4 w-4 transition-transform duration-200', menuOpen && 'rotate-45')} strokeWidth={2.6} />
        {t('fab.desktopAdd')}
      </button>

      {menuOpen && (
        <div role="menu" className="absolute inset-x-3 top-[calc(100%-4px)] z-50 rounded-2xl border border-line bg-popover p-1.5 shadow-xl">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={item.onClick}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-sunken"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-foreground">{item.label}</span>
                <span className="block truncate text-[11.5px] text-muted-1">{item.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <GroupExpenseLauncher
        open={launcher.open}
        onClose={() => setLauncher(CLOSED)}
        mode={launcher.mode}
        presetGroupId={launcher.presetGroupId}
        scanFile={launcher.scanFile}
      />
      {scanPicker.inputs}
    </div>
  );
}
