import { useMemo } from 'react';
import { NavLink, useMatch, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock, ChevronLeft, LogOut, Moon, PieChart, Plus, Receipt, Settings, Sun, User, Users,
} from 'lucide-react';
import { useGroups, useGroup } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useSettlementState } from '@/contexts/SettlementContext';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { JirensMark } from '@/components/brand/JirensMark';
import { formatCurrency } from '@/utils/format';
import { avatarBg, initials } from '@/utils/avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onLogout: () => void;
  onNavigate?: () => void;
  onNewGroup?: () => void;
}

/**
 * El sidebar de desktop.
 *
 * Cambia con el lugar: afuera de un grupo son los tres destinos y la lista de grupos; adentro,
 * las cinco secciones de ese grupo más tu posición y el botón de saldar (§6.3). Es el mismo
 * material que el encabezado de grupo en mobile, con más aire — nada se abre tapando nada.
 */
export function Sidebar({ onLogout, onNavigate, onNewGroup }: SidebarProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: groups = [] } = useGroups();
  const { resolved: theme, toggle } = useTheme();
  const currentMember = useCurrentMember();
  const { yourBalance } = useSettlementState();
  const { year, month } = useMonthSearchParams();

  const groupMatchExact = useMatch('/groups/:groupId');
  const groupMatchSub = useMatch('/groups/:groupId/*');
  const groupMatch = groupMatchExact ?? groupMatchSub;
  const rawId = groupMatch?.params?.groupId;
  const groupId = rawId && /^\d+$/.test(rawId) ? parseInt(rawId, 10) : null;
  const inGroup = groupId !== null;
  const { data: group } = useGroup(groupId ?? 0);

  const monthQuery = `?year=${year}&month=${month}`;

  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
  const toggleLang = () => {
    const next = currentLang === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  const groupTabs = useMemo(() => ([
    { label: t('tabs.expenses'), to: `/groups/${groupId}${monthQuery}`, icon: Receipt, end: true },
    { label: t('tabs.members'),  to: `/groups/${groupId}/members${monthQuery}`, icon: Users },
    { label: t('tabs.charts'),   to: `/groups/${groupId}/charts${monthQuery}`, icon: PieChart },
    { label: t('tabs.dueDates'), to: `/groups/${groupId}/due-dates`, icon: CalendarClock },
    { label: t('tabs.settings'), to: `/groups/${groupId}/settings${monthQuery}`, icon: Settings },
  ]), [groupId, monthQuery, t]);

  const globalTabs = [
    { label: t('mobileNav.personal'), to: '/personal', icon: User, end: true },
    { label: t('mobileNav.groups'),   to: '/groups',   icon: Users, end: true },
    { label: t('nav.numbers'),        to: '/personal/charts', icon: PieChart },
  ];

  const link = ({ isActive }: { isActive: boolean }) => cn(
    'flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-[13px] transition-colors',
    isActive
      ? 'bg-white/[0.09] font-bold text-paper'
      : 'font-medium text-muted-on-dark hover:bg-white/[0.05] hover:text-paper',
  );

  return (
    <div className="flex h-screen w-full flex-col bg-ink">
      {/* ── Marca ───────────────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => { navigate('/groups'); onNavigate?.(); }}
        className="flex cursor-pointer items-center gap-2.5 px-4 pb-4 pt-5 text-left"
      >
        <JirensMark tone="night" className="text-white" size={30} />
        <span className="text-[19px] font-extrabold leading-none tracking-[-0.025em] text-paper">Jirens</span>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {inGroup ? (
          <>
            <Link
              to="/groups"
              onClick={onNavigate}
              className="mb-2 inline-flex items-center gap-0.5 px-1 text-[11.5px] font-semibold text-muted-on-dark-2 transition-colors hover:text-paper"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('mobileNav.groups')}
            </Link>
            <p className="mb-3 truncate px-1 text-[20px] font-bold leading-none tracking-[-0.025em] text-paper">
              {group?.name}
            </p>

            <nav className="space-y-0.5">
              {groupTabs.map(tab => (
                <NavLink key={tab.to} to={tab.to} end={tab.end} onClick={onNavigate} className={link}>
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Tu posición en el grupo, con la salida a saldar */}
            {yourBalance != null && (
              <div className="mt-4 rounded-card bg-white/[0.06] p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-on-dark-2">
                  {t('settle.yourPosition')}
                </p>
                <p
                  className={cn(
                    'mt-1 text-[22px] font-extrabold leading-none tracking-[-0.025em] tabular-nums',
                    Math.abs(yourBalance) <= 0.01
                      ? 'text-paper'
                      : yourBalance > 0 ? 'text-positive-on-dark' : 'text-negative-on-dark',
                  )}
                >
                  {Math.abs(yourBalance) <= 0.01
                    ? t('settle.allSquare')
                    : `${yourBalance > 0 ? '+' : ''}${formatCurrency(yourBalance)}`}
                </p>
                <Link
                  to={`/groups/${groupId}/members${monthQuery}`}
                  onClick={onNavigate}
                  className="mt-2.5 flex h-9 items-center justify-center rounded-pill bg-brand-soft text-[12px] font-bold text-ink transition-opacity hover:opacity-90"
                >
                  {t('nav.settleUp')}
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <nav className="space-y-0.5">
              {globalTabs.map(tab => (
                <NavLink key={tab.to} to={tab.to} end={tab.end} onClick={onNavigate} className={link}>
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </NavLink>
              ))}
            </nav>

            <p className="mb-2 mt-5 px-3 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-on-dark-2">
              {t('mobileNav.groups')}
            </p>
            <nav className="space-y-0.5">
              {groups.map(g => (
                <NavLink key={g.id} to={`/groups/${g.id}`} onClick={onNavigate} className={link}>
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[10px] font-bold text-white',
                    avatarBg(g.id),
                  )}>
                    {initials(g.name)}
                  </span>
                  <span className="truncate">{g.name}</span>
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => { onNewGroup?.(); onNavigate?.(); }}
              className="mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2 text-[13px] font-medium text-brand-soft transition-colors hover:bg-white/[0.05]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {t('groups.newGroup')}
            </button>
          </>
        )}
      </div>

      {/* ── Pie: perfil, idioma, tema, salir ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] px-3 py-3">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
            avatarBg(currentMember?.id ?? 1),
          )}>
            {initials(currentMember?.name ?? '?')}
          </span>
          <span className="truncate text-[12.5px] font-medium text-muted-on-dark">
            {currentMember?.name ?? t('nav.profile')}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('nav.toggleTheme')}
            className="h-7 cursor-pointer rounded-full px-2 text-[11px] font-bold text-muted-on-dark transition-colors hover:bg-white/10 hover:text-paper"
          >
            {t('language')}
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={t('nav.toggleTheme')}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-on-dark transition-colors hover:bg-white/10 hover:text-paper"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('nav.logout')}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-on-dark transition-colors hover:bg-white/10 hover:text-paper"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
