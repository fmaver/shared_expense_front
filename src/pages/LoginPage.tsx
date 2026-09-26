import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowDown, ChevronLeft } from 'lucide-react';
import { login, register } from '@/api/auth';
import { FieldBox } from '@/components/ui/FieldBox';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { JirensMark } from '@/components/brand/JirensMark';
import { normalizeArPhone } from '@/utils/phone';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

/** El logo real de Google, en sus cuatro colores. Un círculo azul no es el logo de Google. */
function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where to land after logging in. Only same-origin paths are honoured, or this becomes an
  // open redirect: `https://evil.example` is rejected by the leading-slash check, and
  // `//evil.example` by the second one — browsers read a protocol-relative URL as absolute.
  const nextParam = searchParams.get('next');
  const isSameOrigin = !!nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//');
  const destination = isSameOrigin ? nextParam : '/groups';

  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setName(''); setTelephone(''); setError('');
  };

  const storeSession = (token: string) => {
    const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    onLoginSuccess(token);
    navigate(destination);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsLoading(true); setSlowWarning(false);
    // El backend duerme en Render; a los 5 segundos se avisa en vez de dejar el botón girando.
    const slowTimer = setTimeout(() => setSlowWarning(true), 5000);
    try {
      const res = await login({ username: email, password });
      clearTimeout(slowTimer);
      storeSession(res.access_token);
    } catch {
      clearTimeout(slowTimer);
      setError(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
      setSlowWarning(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    setError(''); setIsLoading(true);
    try {
      await register({ name, email, password, telephone: normalizeArPhone(telephone) || undefined });
      const res = await login({ username: email, password });
      storeSession(res.access_token);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      className="cursor-pointer text-[12.5px] font-semibold text-muted-1 hover:text-foreground"
    >
      {showPassword ? t('auth.hide') : t('auth.show')}
    </button>
  );

  return (
    // Tinta a sangre completa, y la tarjeta de papel flotando encima.
    <div className="min-h-screen bg-ink px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        {mode === 'login' ? (
          <div className="pt-6">
            <JirensMark tone="night" className="text-white" size={44} />
            <h1 className="mt-6 whitespace-pre-line text-[29px] font-bold leading-[1.15] tracking-[-0.025em] text-paper">
              {t('auth.heroTitle')}
            </h1>
            <p className="mt-3 text-[15px] font-medium leading-[1.5] text-muted-on-dark">
              {t('auth.heroSubtitle')}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => { reset(); setMode('login'); }}
              className="flex cursor-pointer items-center gap-0.5 text-[14px] font-medium text-muted-on-dark hover:text-paper"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('auth.backToLogin')}
            </button>
            <JirensMark tone="night" className="text-white" size={30} />
          </div>
        )}

        {mode === 'register' && (
          <div className="mt-4">
            <h1 className="text-[26px] font-bold leading-none tracking-[-0.025em] text-paper">{t('auth.registerTitle')}</h1>
            <p className="mt-2.5 text-[14px] font-medium leading-[1.45] text-muted-on-dark">
              {t('auth.registerSubtitle')}
            </p>
          </div>
        )}

        {/* ── La tarjeta ────────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-[24px] bg-paper p-5">
          {error && (
            <p className="mb-3 rounded-[12px] border border-negative-wash-line bg-negative-wash px-3 py-2 text-[12.5px] font-semibold text-negative-ink">
              {error}
            </p>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Sigue siendo un mock: no hay OAuth en el backend todavía. */}
              <button
                type="button"
                onClick={() => toast.info(t('auth.googleSoon'))}
                className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[12px] border border-line-strong bg-surface text-[15px] font-semibold text-ink transition-colors hover:bg-surface-sunken"
              >
                <GoogleMark />
                {t('auth.continueWithGoogleShort')}
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-line-strong" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                  {t('auth.orWithMail')}
                </span>
                <span className="h-px flex-1 bg-line-strong" />
              </div>

              <FieldBox
                label={t('auth.mail')}
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <FieldBox
                label={t('auth.passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                action={passwordToggle}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full cursor-pointer rounded-[12px] bg-brand text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isLoading ? t('auth.signingIn') : t('auth.enter')}
              </button>

              {slowWarning && (
                <p className="animate-pulse text-center text-[11.5px] font-medium text-muted-1">
                  {t('auth.coldStartWarning')}
                </p>
              )}

              <p className="pt-1 text-center text-[13px] font-medium text-muted-1">
                {t('auth.firstTime')}{' '}
                <button
                  type="button"
                  onClick={() => { reset(); setMode('register'); }}
                  className="cursor-pointer font-bold text-brand-ink hover:underline"
                >
                  {t('auth.createYourAccount')}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <FieldBox
                label={t('auth.nameLabel')}
                required
                autoComplete="name"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <FieldBox
                label={t('auth.mail')}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              {/* El celular necesita el selector de país, así que no entra en FieldBox. */}
              <div className="rounded-[12px] border border-line-strong bg-surface px-3.5 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
                    {t('auth.phoneLabel')}
                  </span>
                  <span className="truncate text-[10.5px] font-medium text-muted-3">
                    {t('auth.phoneHint')}
                  </span>
                </div>
                <div className="mt-1">
                  <PhoneInput id="phone" value={telephone} onChange={setTelephone} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldBox
                  label={t('auth.passwordLabel')}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <FieldBox
                  label={t('auth.repeatLabel')}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full cursor-pointer rounded-[12px] bg-brand text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>
            </form>
          )}
        </div>

        {/* ── El aviso de iOS, por fuera de la tarjeta ──────────────────────────────── */}
        {mode === 'register' && (
          <div className="mt-3 flex items-start gap-3 rounded-card border border-white/[0.08] bg-white/[0.05] p-3.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20">
              <ArrowDown className="h-4 w-4 text-brand-soft" aria-hidden="true" />
            </span>
            <p className="text-[13px] font-medium leading-[1.45] text-muted-on-dark">
              {t('auth.iosTip')}{' '}
              <a
                href="https://support.apple.com/es-lamr/guide/iphone/iph42ab2f3a7/ios"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-soft hover:underline"
              >
                {t('auth.iosTipLink')}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
