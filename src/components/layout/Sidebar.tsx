import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onNavigate?: () => void;
}

function getInitials(token: string | null): { initials: string; name: string } {
  try {
    if (!token) return { initials: '?', name: '' };
    const payload = JSON.parse(atob(token.split('.')[1]));
    const n = (payload.name ?? payload.sub ?? '') as string;
    const initials = n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    return { initials, name: n };
  } catch {
    return { initials: '?', name: '' };
  }
}

export function Sidebar({ onLogout, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { data: groups = [] } = useGroups();
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
  const toggleLang = () => {
    const next = currentLang === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };
  const { initials, name } = getInitials(localStorage.getItem('token'));

  const go = (to: string) => { navigate(to); onNavigate?.(); };

  return (
    <div className="flex flex-col w-full h-screen bg-card dark:bg-sidebar border-r border-border">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <button onClick={() => go('/groups')} className="flex items-center gap-2.5 w-full text-left">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black text-base flex-shrink-0">✦</div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-foreground leading-none">Jirens</div>
            <div className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground mt-0.5">Shared Expenses</div>
          </div>
        </button>
      </div>

      <Separator />

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">Groups</p>
        <nav className="space-y-0.5">
          {groups.map(group => (
            <NavLink key={group.id} to={`/groups/${group.id}`} onClick={onNavigate}
              className={({ isActive }) => cn(
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-foreground font-semibold border-l-2 border-brand'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}>
              <span className="truncate">{group.name}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={() => go('/groups?new=1')}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-primary hover:bg-accent w-full mt-1">
          <Plus className="h-3.5 w-3.5" /> New group
        </button>
      </div>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <button onClick={() => go('/profile')}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground truncate">{name || 'Profile'}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={toggleLang}
            className="h-7 px-1.5 rounded-md text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label="Switch language"
          >
            {t('language')}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('nav.toggleTheme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
