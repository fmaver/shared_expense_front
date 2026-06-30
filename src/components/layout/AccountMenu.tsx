import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { getCurrentUser } from '@/api/auth';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, LogOut, Languages, Settings, ChevronRight } from 'lucide-react';

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface AccountMenuProps {
  onLogout: () => void;
}

export function AccountMenu({ onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
  const toggleLang = () => {
    const next = currentLang === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  useEffect(() => {
    getCurrentUser()
      .then(u => {
        setDisplayName(u.name);
        setEmail(u.email ?? '');
      })
      .catch(() => {});
  }, []);
  const initials = getInitials(displayName);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Avatar trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0"
        aria-label="Abrir cuenta"
      >
        {initials}
      </button>

      <SheetContent side="top" className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <SheetTitle className="text-base font-bold text-foreground">Cuenta</SheetTitle>
          {/* Close button is rendered by SheetContent automatically */}
        </div>

        {/* User info */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Dark mode toggle */}
        <div className="px-4 py-1">
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center justify-between py-3 text-sm text-foreground cursor-pointer hover:bg-accent rounded-md px-2 -mx-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
              <span>Modo oscuro</span>
            </div>
            {/* Toggle pill */}
            <div
              className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                theme === 'dark' ? 'bg-brand' : 'bg-muted'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Language */}
        <div className="px-4 py-1">
          <button
            type="button"
            onClick={toggleLang}
            className="w-full flex items-center justify-between py-3 text-sm text-foreground cursor-pointer hover:bg-accent rounded-md px-2 -mx-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <span>Idioma</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <span>{currentLang === 'es' ? 'Español' : 'English'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>

        <Separator />

        {/* Settings (navigates to profile page) */}
        <div className="px-4 py-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 py-3 text-sm text-foreground cursor-pointer hover:bg-accent rounded-md px-2 -mx-2 transition-colors"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span>Configuración</span>
          </button>
        </div>

        {/* Logout */}
        <div className="px-4 py-1 pb-4">
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 py-3 text-sm text-destructive cursor-pointer hover:bg-destructive/5 rounded-md px-2 -mx-2 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
