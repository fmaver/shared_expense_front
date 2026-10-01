import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicShell } from './PublicShell';
import { resolveJoinToken, registerAndJoin } from '@/api/joinLinks';
import type { GroupJoinResolveResponse } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone } from 'lucide-react';
import axios from 'axios';
import { markCameFromGroupLink } from '@/utils/installGuide';

interface Props {
  onLoginSuccess: (token: string) => void;
}

export function GroupJoinLanding({ onLoginSuccess }: Props) {
  // Estos links abren el navegador aunque ya tengas la app: en esta visita no se ofrece instalarla.
  useEffect(() => { markCameFromGroupLink(); }, []);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [info, setInfo] = useState<GroupJoinResolveResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Which existing name-only member the joiner says they are; undefined = a new person.
  const [claimMemberId, setClaimMemberId] = useState<number | undefined>(undefined);

  // A logged-in visitor joins with their JWT — no registration form at all.
  const isLoggedIn = !!localStorage.getItem('token');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // The claim choice rides in the URL rather than local state, so it survives the trip
    // out to /login and back.
    const claimFromUrl = searchParams.get('claim');
    if (claimFromUrl) setClaimMemberId(Number(claimFromUrl));
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    resolveJoinToken(token)
      .then(setInfo)
      .catch(err => setLoadError(err instanceof Error ? err.message : t('invite.invalidJoin')));
  }, [token, t]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setIsSubmitting(true);
      const result = await registerAndJoin(
        token,
        isLoggedIn
          ? { claimMemberId }
          : { name: name.trim(), email: email.trim(), password, claimMemberId },
      );
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', result.accessToken);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;
      onLoginSuccess(result.accessToken);
      toast.success(t('invite.welcome'));
      navigate('/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invite.joinFailed'));
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

  const claimable = info.claimableMembers ?? [];

  if (info.alreadyMember) {
    return (
      <PublicShell
        title={t('invite.alreadyIn')}
        subtitle={t('invite.alreadyInDesc', { group: info.groupName })}
      >
        <Link
          to="/groups"
          className="flex h-12 w-full items-center justify-center rounded-[12px] bg-brand text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('invite.goToGroup')}
        </Link>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title={t('invite.joinTitle', { group: info.groupName })}
      subtitle={t('invite.joinSubtitle')}
    >
      <>

          {claimable.length > 0 && (
            <div className="mb-5 space-y-1.5">
              <p className="text-[13px] font-bold text-foreground">{t('invite.areYouOneOf')}</p>
              <p className="mb-2 text-[11.5px] font-medium leading-[1.45] text-muted-2">
                {t('invite.claimHelp')}
              </p>
              {claimable.map(member => (
                <button
                  key={member.memberId}
                  type="button"
                  onClick={() => {
                    setClaimMemberId(member.memberId);
                    setName(member.name);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    claimMemberId === member.memberId
                      ? 'border-brand bg-brand/10 text-foreground font-medium'
                      : 'border-border hover:bg-muted/50 text-foreground'
                  }`}
                >
                  {member.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setClaimMemberId(undefined);
                  setName('');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                  claimMemberId === undefined
                    ? 'border-brand bg-brand/10 text-foreground font-medium'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                {t('invite.noneOfThem')}
              </button>
            </div>
          )}

          {isLoggedIn ? (
            <form onSubmit={handleJoin} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t('invite.signedInNote')}
                {claimable.length > 0 && ` ${t('invite.signedInPickNote')}`}
              </p>
              <Button
                type="submit"
                className="w-full bg-brand hover:bg-brand/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('invite.joining') : t('invite.join')}
              </Button>
            </form>
          ) : (
          <>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('invite.fullName')}</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{t('invite.email')}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {t('profile.phone')}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 541138718498"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('invite.phoneHelp')}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t('invite.password')}</Label>
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
              disabled={isSubmitting || !name.trim() || !email.trim() || !password}
            >
              {isSubmitting ? 'Joining…' : t('invite.createAndJoin')}
            </Button>
          </form>

          {/* Already have an account: log in and come back, carrying the claim choice in the
              URL so the selection survives the round trip. */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={`/login?next=${encodeURIComponent(
                `/join/${token}${claimMemberId ? `?claim=${claimMemberId}` : ''}`,
              )}`}
              className="font-medium text-brand hover:underline"
            >
              Log in
            </Link>
          </p>
          </>
          )}
      </>
    </PublicShell>
  );
}
