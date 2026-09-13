import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, KeyRound, LogOut } from 'lucide-react';
import { getCurrentUser, updateProfile, type NotificationType } from '@/api/auth';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Skeleton } from '@/components/ui/skeleton';
import { PushCard } from '@/components/ui/PushCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ConfigSheet } from '@/components/layout/ConfigSheet';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { avatarBg, initials } from '@/utils/avatar';
import { normalizeArPhone, localArPhone } from '@/utils/phone';
import { cn } from '@/lib/utils';

/** Un bloque con su rótulo. Fuera del componente: adentro se remontaría en cada render. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">{label}</p>
      {children}
    </div>
  );
}

/**
 * Perfil.
 *
 * Los avisos van primero porque es lo que la gente viene a cambiar; los datos, después (§6.13).
 */
export function ProfilePage({ onLogout }: { onLogout?: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [channel, setChannel] = useState<NotificationType>('NONE');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(user => {
        setMemberId(user.id);
        setName(user.name);
        setEmail(user.email);
        setTelephone(localArPhone(user.telephone));
        setChannel(user.notificationPreference);
      })
      .catch(() => {
        toast.error('Failed to load user data');
        navigate('/');
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
  const changeLanguage = (lang: 'es' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === 'WHATSAPP' && !telephone) {
      toast.error(t('profile.whatsappNeedsPhone'));
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
        telephone: normalizeArPhone(telephone),
        notification_preference: channel,
      });
      toast.success(t('toasts.profileUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-3 px-5 py-6">
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 px-5 py-6">
      {/* ── Quién sos ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className={cn(
          'flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-full text-[15px] font-bold text-white',
          avatarBg(memberId ?? 1),
        )}>
          {initials(name, 2)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[26px] leading-none text-foreground">{name}</h1>
          <p className="mt-1 truncate text-[12px] font-medium text-muted-2">{email}</p>
        </div>
      </div>

      {/* ── Avisos, primero ─────────────────────────────────────────────────────────── */}
      <Section label={t('profile.notifications')}>
        <PushCard />
        <div className="mt-3 rounded-card border border-line bg-surface p-4 shadow-card">
          <p className="text-[12.5px] font-bold text-foreground">{t('profile.fallbackChannel')}</p>
          <SegmentedControl
            className="mt-2.5"
            aria-label={t('profile.fallbackChannel')}
            value={channel}
            onChange={setChannel}
            options={[
              { value: 'EMAIL' as NotificationType, label: t('profile.notifEmail') },
              { value: 'WHATSAPP' as NotificationType, label: t('profile.notifWhatsapp') },
              { value: 'NONE' as NotificationType, label: t('profile.notifNone') },
            ]}
          />
          {channel === 'WHATSAPP' && !telephone && (
            <p className="mt-2 text-[11.5px] font-medium text-negative">
              {t('profile.whatsappNeedsPhone')}
            </p>
          )}
        </div>
      </Section>

      {/* ── Datos ───────────────────────────────────────────────────────────────────── */}
      <Section label={t('profile.yourData')}>
        <form onSubmit={save} className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-card">
          <div>
            <label htmlFor="name" className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
              {t('profile.fullName')}
            </label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1.5 text-[13px]" />
          </div>
          <div>
            <label htmlFor="email" className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
              {t('profile.email')}
            </label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1.5 text-[13px]" />
          </div>
          <div>
            <label htmlFor="telephone" className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
              {t('profile.phone')}
            </label>
            <div className="mt-1.5">
              <PhoneInput id="telephone" value={telephone} onChange={setTelephone} />
            </div>
            <p className="mt-1 text-[11px] font-medium text-muted-2">{t('profile.phoneHelp')}</p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 w-full cursor-pointer rounded-[12px] bg-brand text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? t('profile.saving') : t('profile.saveProfile')}
          </button>
        </form>
      </Section>

      {/* ── App ─────────────────────────────────────────────────────────────────────── */}
      <Section label="App">
        <div className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-card">
          <div>
            <p className="mb-2 text-[12.5px] font-bold text-foreground">{t('profile.theme')}</p>
            <SegmentedControl
              aria-label={t('profile.theme')}
              value={theme}
              onChange={(value: ThemePreference) => setTheme(value)}
              options={[
                { value: 'light' as ThemePreference, label: t('profile.themeLight') },
                { value: 'dark' as ThemePreference, label: t('profile.themeDark') },
                { value: 'system' as ThemePreference, label: t('profile.themeAuto') },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-bold text-foreground">{t('profile.language')}</p>
            <SegmentedControl
              aria-label={t('profile.language')}
              value={currentLang}
              onChange={changeLanguage}
              options={[
                { value: 'es' as const, label: 'ES' },
                { value: 'en' as const, label: 'EN' },
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(true)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-[12px] border border-line px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-muted-1" aria-hidden="true" />
            <span className="flex-1 text-[12.5px] font-bold text-foreground">
              {t('profile.changePassword')}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-3" aria-hidden="true" />
          </button>
        </div>
      </Section>

      {/* ── Cerrar sesión ───────────────────────────────────────────────────────────── */}
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-negative-wash-line bg-surface text-[13px] font-bold text-negative transition-colors hover:bg-negative-wash"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('nav.logout')}
        </button>
      )}

      <p className="pb-2 text-center text-[11px] font-medium text-muted-3">
        {t('profile.version', { version: __APP_VERSION__ })}
      </p>

      <ConfigSheet open={showPassword} onOpenChange={setShowPassword} />
    </div>
  );
}
