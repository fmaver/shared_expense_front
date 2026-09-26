import React, { useCallback, useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useGroup } from '@/hooks/useGroups';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { useScroll } from '@/contexts/ScrollContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SegmentedLinks } from '@/components/ui/Segmented';
import { CapsuleSlot, GlassCapsule } from '@/components/ui/Glass';
import { FloatingTopBar, TopBarSpacer } from '@/components/layout/FloatingTopBar';
import { GroupMoreMenu } from '@/components/layout/GroupMoreMenu';
import { FEATURE_SEARCH } from '@/config/features';
import { avatarBg, initials } from '@/utils/avatar';

/** "Fran, Guada y Mati" — la lista de nombres como se dice en voz alta. */
function joinNames(names: string[], and: string): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}

export function GroupLayout() {
  const { groupId: gp } = useParams<{ groupId: string }>();
  const groupId = parseInt(gp!, 10);
  const { data: group, isLoading } = useGroup(groupId);
  const location = useLocation();
  const { t } = useTranslation();
  const { notifyScroll } = useScroll();
  const { year, month } = useMonthSearchParams();
  const [titleEl, setTitleEl] = useState<HTMLHeadingElement | null>(null);
  const handleInnerScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    notifyScroll((e.target as HTMLElement).scrollTop);
  }, [notifyScroll]);

  // El orden es el del handoff (§6.3) y es el mismo en las cinco pantallas.
  const TABS = [
    { label: t('tabs.expenses'), path: '' },
    { label: t('tabs.members'),  path: 'members' },
    { label: t('tabs.charts'),   path: 'charts' },
    { label: t('tabs.dueDates'), path: 'due-dates' },
    { label: t('tabs.settings'), path: 'settings' },
  ];

  const members = group?.members ?? [];
  const isOneTime = group?.groupType === 'one_time';

  /*
    Las pestañas se llevan el mes puesto.
    Gastos y Números comparten alcance a través de `?year=&month=`, y sin esto cambiar de
    pestaña lo perdía y te devolvía al mes actual. `expense` y `highlight` no viajan: son
    de un solo uso, del deep-link de una notificación.
  */
  const monthQuery = `?year=${year}&month=${month}`;

  /*
    El subtítulo cambia con la pestaña.
    Los nombres del grupo sólo importan en Gastos, donde uno lee filas de gente; en Gente eso
    se repetiría contra la lista de abajo, y en Números o Vencimientos no dice nada del
    contenido de la pantalla. Cada una dice lo suyo con lo que el layout ya tiene a mano.
  */
  const months = t('months', { returnObjects: true }) as string[];
  const subtitle = (() => {
    const section = location.pathname.split('/')[3] ?? '';
    const people = t('groups.peopleCount', { count: members.length });

    if (section === 'members') {
      const since = group?.createdAt
        ? `${months[new Date(group.createdAt).getMonth()] ?? ''} ${new Date(group.createdAt).getFullYear()}`
        : null;
      return since
        ? `${people} · ${t('groups.sinceWhen', { when: since.toLocaleLowerCase() })}`
        : people;
    }
    if (section === 'charts') {
      return isOneTime ? people : `${months[month - 1] ?? ''} ${year}`;
    }
    if (section === 'due-dates') return t('dueDates.headerSubtitle');
    if (section === 'settings') return t('settings.headerSubtitle');

    // Gastos: quiénes están. En un evento son demasiados para nombrarlos.
    if (members.length === 0) return '';
    return isOneTime ? people : joinNames(members.map(m => m.name), t('groups.and'));
  })();

  const tabLinks = TABS.map(tab => ({
    to: tab.path === ''
      ? `/groups/${groupId}${monthQuery}`
      : `/groups/${groupId}/${tab.path}${monthQuery}`,
    label: tab.label,
    end: tab.path === '',
  }));
  const tabs = (className?: string) => (
    <SegmentedLinks
      aria-label={t('groups.sections')}
      className={cn('overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
      links={tabLinks}
    />
  );
  /* La línea de contexto de la banda: el mes (si el grupo tiene meses) y lo de la pestaña. */
  const bandContext = [isOneTime ? null : `${months[month - 1] ?? ''} ${year}`, subtitle]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-1 flex-col">
      {/*
        Arriba, en mobile, los controles flotantes (V6.2): volver a Grupos y la cápsula con
        buscar y ⋯. Al scrollear pasado el nombre del grupo aparece la banda de vidrio con el
        nombre compacto y las pestañas pegadas.
      */}
      <FloatingTopBar
        back={{ to: '/groups', label: t('mobileNav.groups') }}
        right={
          <GlassCapsule>
            {FEATURE_SEARCH && (
              <CapsuleSlot to={`/search?scope=group&groupId=${groupId}`} aria-label={t('search.open')}>
                <Search className="h-[17px] w-[17px]" strokeWidth={2.4} />
              </CapsuleSlot>
            )}
            <GroupMoreMenu groupId={groupId} groupName={group?.name ?? ''} />
          </GlassCapsule>
        }
        band={{ watch: titleEl, title: group?.name ?? '', context: bandContext, below: tabs() }}
      />

      {/* Tab content: el encabezado scrollea con el contenido, así la banda tiene de qué salir. */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0"
        onScroll={handleInnerScroll}
      >
        {/*
          En desktop este encabezado no se dibuja: el sidebar ya trae el nombre del grupo, la
          salida y las cinco secciones (§6.3). Dibujarlo igual era decir todo dos veces.
        */}
        <div className="mx-auto w-full max-w-5xl px-5 pb-1 pt-3 lg:hidden">
          <TopBarSpacer />
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-7 w-44" />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 ref={setTitleEl} className="truncate text-[23px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">
                    {group?.name}
                  </h1>
                  {isOneTime && (
                    <span className="shrink-0 rounded-chip bg-tag-split-wash px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-tag-split">
                      {t('expenses.badgeEvent')}
                    </span>
                  )}
                </div>
              )}
              {subtitle && (
                <p className="mt-1.5 truncate text-[12px] font-medium text-muted-2">{subtitle}</p>
              )}
            </div>

            {/* Stack de avatares: se superponen 9px y llevan borde del color del fondo. */}
            {members.length > 0 && (
              <div className="flex shrink-0 items-center pb-0.5" aria-hidden="true">
                {members.slice(0, 4).map((m, i) => (
                  <div
                    key={m.memberId}
                    className={cn(
                      'flex h-[30px] w-[30px] select-none items-center justify-center rounded-full',
                      'border-2 border-background text-[11px] font-bold text-white',
                      avatarBg(m.memberId),
                      i > 0 && '-ml-[9px]',
                    )}
                  >
                    {initials(m.name)}
                  </div>
                ))}
                {members.length > 4 && (
                  <div className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-background bg-surface-sunken text-[10px] font-bold text-muted-1">
                    +{members.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {tabs('mt-3')}
        </div>

        <Outlet />
      </div>
    </div>
  );
}
