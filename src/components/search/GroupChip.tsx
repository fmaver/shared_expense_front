import { Archive, Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { avatarBg } from '@/utils/avatar';
import type { GroupType } from '@/types/expense';

/**
 * Chip de grupo de la fila de búsqueda V8 (ADDENDUM-violeta.md, "Ajuste V8").
 *
 * Dos ejes independientes: el **tipo** (ícono a la izquierda — persona para Personal,
 * punto de color de avatar para un grupo regular, calendario para un evento) y el
 * **archivado**, que se combina con cualquier tipo: fondo transparente, borde punteado y
 * un "archivado" al final, separado por un divisor.
 */
export function GroupChip({ name, groupId, groupType, archived }: {
  name: string;
  groupId: number;
  groupType: GroupType;
  archived: boolean;
}) {
  const { t } = useTranslation();
  const label = groupType === 'personal' ? t('search.personal') : name;
  // #E1DCF0 / #2F2A45 no tienen token exacto propio (ver brand-wash-line / line para los
  // valores más cercanos) — se dejan como hex del handoff con su variante dark.
  const typeIconClass = archived ? 'text-muted-1' : 'text-brand-ink';

  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-[5px] whitespace-nowrap rounded-full px-2 py-0.5',
        'text-[11px] font-bold leading-none',
        archived
          ? 'border border-dashed border-muted-3 bg-transparent text-[#57526E] dark:text-muted-1'
          : 'border border-[#E1DCF0] bg-brand-wash text-[#2F2A45] dark:border-brand-wash-line dark:text-brand-ink',
      )}
    >
      {groupType === 'regular' ? (
        // Archivado: el punto también se apaga a muted — "ícono en muted" se combina con
        // cualquier tipo, el punto de color no es una excepción.
        <span className={cn('h-[9px] w-[9px] shrink-0 rounded-full', archived ? 'bg-muted-3' : avatarBg(groupId))} aria-hidden="true" />
      ) : groupType === 'one_time' ? (
        <Calendar className={cn('h-[11px] w-[11px] shrink-0', typeIconClass)} strokeWidth={2.6} aria-hidden="true" />
      ) : (
        <User className={cn('h-[11px] w-[11px] shrink-0', typeIconClass)} strokeWidth={2.6} aria-hidden="true" />
      )}
      {/* El tope va sólo en el nombre: puesto en el chip entero, el sufijo "archivado" se comía
          el nombre aun en desktop ("Viaje Ba…"). */}
      <span className="min-w-0 max-w-[160px] truncate">{label}</span>
      {archived && (
        <span className="flex shrink-0 items-center gap-[3px] border-l border-line-strong pl-1 font-semibold text-muted-1">
          <Archive className="h-[11px] w-[11px]" strokeWidth={2.6} aria-hidden="true" />
          {t('search.archived')}
        </span>
      )}
    </span>
  );
}
