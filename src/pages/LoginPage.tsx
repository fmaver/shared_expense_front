import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, register } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone } from 'lucide-react';
import axios from 'axios';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setName(''); setTelephone(''); setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      const res = await login({ username: email, password });
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;
      onLoginSuccess(res.access_token);
      navigate('/groups');
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    setError(''); setIsLoading(true);
    try {
      await register({ name, email, password, telephone: telephone.trim() || undefined });
      const res = await login({ username: email, password });
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;
      onLoginSuccess(res.access_token);
      navigate('/groups');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl mb-3">
            <span className="text-white font-black text-xl">✦</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Jirens</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-0.5">
            {t('nav.sharedExpenses')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Google mock */}
          <Button type="button" variant="outline" className="w-full mb-4 font-medium"
            onClick={() => toast.info(t('auth.googleSoon'))}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t('auth.or')}</span>
            <Separator className="flex-1" />
          </div>

          {error && (
            <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" required autoComplete="email" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password" value={password}
                    onChange={e => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand/90 text-white font-semibold" disabled={isLoading}>
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <button type="button" onClick={() => { reset(); setMode('register'); }}
                  className="text-primary font-medium hover:underline">{t('auth.createOne')}</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('auth.fullName')}</Label>
                <Input id="name" required autoComplete="name" autoFocus
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">{t('auth.email')}</Label>
                <Input id="reg-email" type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {t('auth.whatsappPhone')}
                  <span className="text-muted-foreground font-normal">{t('auth.optional')}</span>
                </Label>
                <Input id="phone" type="tel" placeholder="e.g. 541138718498"
                  value={telephone} onChange={e => setTelephone(e.target.value)} />
                <p className="text-xs text-muted-foreground">{t('auth.phoneHelp')}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="new-password" minLength={6}
                    value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
                <Input id="confirm" type={showPassword ? 'text' : 'password'} required
                  autoComplete="new-password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand/90 text-white font-semibold" disabled={isLoading}>
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <button type="button" onClick={() => { reset(); setMode('login'); }}
                  className="text-primary font-medium hover:underline">{t('auth.signInLink')}</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
