import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicShell } from './PublicShell';
import { resolveInvitation, acceptInvitation } from '@/api/invitations';
import type { InvitationResolveResponse } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { markCameFromGroupLink } from '@/utils/installGuide';

interface Props {
  onLoginSuccess: (token: string) => void;
}

export function InvitationLanding({ onLoginSuccess }: Props) {
  // Estos links abren el navegador aunque ya tengas la app: en esta visita no se ofrece instalarla.
  useEffect(() => { markCameFromGroupLink(); }, []);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [info, setInfo] = useState<InvitationResolveResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New-user (stub) form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    if (!token) return;
    resolveInvitation(token)
      .then(setInfo)
      .catch(err => setLoadError(err instanceof Error ? err.message : t('invite.invalidInvite')));
  }, [token, t]);

  // --- Existing member: accept with current JWT ---
  const handleExistingAccept = async () => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      const result = await acceptInvitation(token, {});
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', result.accessToken);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;
      onLoginSuccess(result.accessToken);
      setAccepted(true);
      toast.success(t('invite.welcome'));
      setTimeout(() => navigate('/groups'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invite.acceptFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- New user (stub): create account and join ---
  const handleStubAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setIsSubmitting(true);
      const result = await acceptInvitation(token, {
        ...(info?.requiresEmail ? { email: email.trim() } : {}),
        password,
      });
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', result.accessToken);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;
      onLoginSuccess(result.accessToken);
      toast.success(t('invite.accountCreated'));
      navigate('/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invite.acceptFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <PublicShell>
        <p className="text-center text-[13px] font-semibold text-negative">{loadError}</p>
      </PublicShell>
    );
  }

  if (!info) {
    return (
      <PublicShell>
        <p className="text-center text-[13px] text-muted-2">{t('invite.loading')}</p>
      </PublicShell>
    );
  }

  if (info.status !== 'pending') {
    const messages: Record<string, string> = {
      expired: t('invite.expired'),
      revoked: t('invite.revoked'),
      accepted: t('invite.alreadyAccepted'),
    };
    return (
      <PublicShell>
            <p className="text-sm text-muted-foreground">
              {messages[info.status] ?? t('invite.noLongerValid')}
            </p>
          </PublicShell>
    );
  }

  const inviteContext = (
    <div className="mb-5">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{info.inviterName}</span> invited you to
        join{' '}
        <span className="font-semibold text-foreground">{info.groupName}</span>.
      </p>
    </div>
  );

  // --- Existing member: not logged in ---
  if (info.isExistingMember && !isLoggedIn) {
    return (
      <PublicShell>
            <h2 className="text-lg font-bold text-foreground mb-1">{t('invite.youreInvited')}</h2>
            {inviteContext}
            <p className="text-sm text-muted-foreground mb-4">
              {t('invite.loginToAccept')}
            </p>
            <Button
              className="w-full bg-brand hover:bg-brand/90 text-primary-foreground font-semibold"
              onClick={() => navigate(`/login?redirect=/invite/${token}`)}
            >
              {t('invite.logInToAccept')}
            </Button>
          </PublicShell>
    );
  }

  // --- Existing member: logged in ---
  if (info.isExistingMember) {
    return (
      <PublicShell>
            <h2 className="text-lg font-bold text-foreground mb-1">{t('invite.youreInvited')}</h2>
            {inviteContext}
            {accepted ? (
              <p className="text-sm text-brand font-medium">{t('invite.welcome')}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  You already have an account. Click below to join{' '}
                  <span className="font-semibold text-foreground">{info.groupName}</span>.
                </p>
                <Button
                  className="w-full bg-brand hover:bg-brand/90 text-primary-foreground font-semibold"
                  onClick={handleExistingAccept}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining…' : t('invite.acceptAndJoin')}
                </Button>
              </>
            )}
          </PublicShell>
    );
  }

  // --- New user (stub): create account ---
  return (
    <PublicShell>
          <h2 className="text-lg font-bold text-foreground mb-1">{t('invite.youreInvited')}</h2>
          {inviteContext}
          <p className="text-sm text-muted-foreground mb-4">{t('invite.createToJoin')}</p>

          <form onSubmit={handleStubAccept} className="space-y-4">
            {info.requiresEmail ? (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="border border-border rounded-md px-3 py-2 bg-muted/50">
                  <p className="text-sm text-foreground">{info.knownEmail}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-primary-foreground font-semibold"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? t('invite.creatingAccount') : t('invite.createAndJoin')}
            </Button>
          </form>
        </PublicShell>
    );
}
