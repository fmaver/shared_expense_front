import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DynamicIsland } from './DynamicIsland';
import { JirensMark } from '@/components/brand/JirensMark';
import { useScroll } from '@/contexts/ScrollContext';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { avatarBg, initials } from '@/utils/avatar';
import type { IslandState } from '@/contexts/IslandContext';

interface MobileHeaderProps {
  state: IslandState | 'group';
  groupName?: string;
}

/**
 * La barra de la app: marca a la izquierda, avatar a la derecha.
 *
 * El avatar es la entrada al perfil. Antes abría una hoja de cuenta con tema, idioma y cerrar
 * sesión — las mismas cosas que ahora tiene la pantalla de Perfil, así que la hoja era una
 * segunda versión del mismo lugar.
 */
export function MobileHeader({ state, groupName }: MobileHeaderProps) {
  const { isAtTop } = useScroll();
  const { t } = useTranslation();
  const currentMember = useCurrentMember();

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 lg:hidden',
        'flex h-12 items-center justify-between px-4',
        'transition-colors duration-500 ease-out',
        isAtTop
          ? 'border-b border-line/60 bg-background/95 backdrop-blur-sm'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {/* Izquierda: la marca. `flex-1` a los dos lados para que la isla quede centrada. */}
      <div className="flex flex-1 items-center">
        <JirensMark className="text-foreground" size={26} />
      </div>

      <DynamicIsland state={state} groupName={groupName} />

      <div className="flex flex-1 justify-end">
        <Link
          to="/profile"
          aria-label={t('nav.profile')}
          className={cn(
            'flex h-8 w-8 select-none items-center justify-center rounded-full',
            'text-[11px] font-bold text-white transition-opacity hover:opacity-90',
            avatarBg(currentMember?.id ?? 1),
          )}
        >
          {initials(currentMember?.name ?? '?')}
        </Link>
      </div>
    </header>
  );
}
