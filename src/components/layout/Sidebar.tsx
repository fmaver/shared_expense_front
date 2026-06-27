import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';
import { getCurrentUser } from '@/api/auth';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Moon, Sun, Plus, LogOut, User } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface SidebarProps {
  onLogout: () => void;
  onNavigate?: () => void;
  onNewGroup?: () => void;
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function Sidebar({ onLogout, onNavigate, onNewGroup }: SidebarProps) {
  const navigate = useNavigate();
  const { data: groups = [] } = useGroups();
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const { displayMode, setDisplayMode, blueRate } = useCurrency();
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
  const toggleLang = () => {
    const next = currentLang === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    getCurrentUser().then(u => setDisplayName(u.name)).catch(() => {});
  }, []);
  const initials = getInitials(displayName);

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

      {/* Personal + Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">{t('personal.title')}</p>
        <nav className="space-y-0.5 mb-3">
          <NavLink to="/personal" onClick={onNavigate}
            className={({ isActive }) => cn(
              'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary/10 text-foreground font-semibold border-l-2 border-brand'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}>
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{t('nav.personal')}</span>
          </NavLink>
        </nav>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">{t('nav.groups')}</p>
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
        <button onClick={() => { onNewGroup?.(); onNavigate?.(); }}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-primary hover:bg-accent w-full mt-1">
          <Plus className="h-3.5 w-3.5" /> {t('groups.newGroup')}
        </button>
      </div>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-3 space-y-2">
        {/* Currency display toggle */}
        {blueRate !== null && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'original' ? 'ars' : 'original')}
              className={cn(
                'h-6 px-2 rounded-md text-[10px] font-semibold transition-colors cursor-pointer',
                displayMode === 'ars'
                  ? 'bg-brand/20 text-brand hover:bg-brand/30'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              title={displayMode === 'ars' ? 'Mostrar moneda original' : 'Ver todo en ARS'}
            >
              {displayMode === 'ars' ? 'Ver original' : 'Ver en ARS'}
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
        <button onClick={() => go('/profile')}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground truncate">{displayName || t('nav.profile')}</span>
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
    </div>
  );
}
