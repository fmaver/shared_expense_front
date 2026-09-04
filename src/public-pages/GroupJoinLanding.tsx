import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resolveJoinToken, registerAndJoin } from '@/api/joinLinks';
import type { GroupJoinResolveResponse } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone } from 'lucide-react';
import axios from 'axios';

interface Props {
  onLoginSuccess: (token: string) => void;
}

export function GroupJoinLanding({ onLoginSuccess }: Props) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

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
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Invalid join link'));
  }, [token]);

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
      toast.success("Welcome! You've joined the group.");
      navigate('/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandHeader = (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl mb-3">
        <span className="text-white font-black text-xl">✦</span>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Jirens</h1>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-0.5">
        Shared Expenses
      </p>
    </div>
  );

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {brandHeader}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <p className="text-sm text-destructive">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          {brandHeader}
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const claimable = info.claimableMembers ?? [];

  if (info.alreadyMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {brandHeader}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <h2 className="text-lg font-bold text-foreground mb-1">You're already in</h2>
            <p className="text-sm text-muted-foreground mb-5">
              You are already a member of{' '}
              <span className="font-semibold text-foreground">{info.groupName}</span>.
            </p>
            <Link
              to="/groups"
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              Go to my groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {brandHeader}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-1">Join group</h2>
          <p className="text-sm text-muted-foreground mb-5">
            You were invited to join{' '}
            <span className="font-semibold text-foreground">{info.groupName}</span>. Create your
            account to get started.
          </p>

          {claimable.length > 0 && (
            <div className="mb-5 space-y-1.5">
              <p className="text-sm font-medium text-foreground">Are you one of these people?</p>
              <p className="text-xs text-muted-foreground mb-2">
                Pick your name to keep the expenses already assigned to you.
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
                I'm someone else
              </button>
            </div>
          )}

          {isLoggedIn ? (
            <form onSubmit={handleJoin} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                You're signed in — joining will use your existing account.
                {claimable.length > 0 && ' Pick your name above to take over its expenses.'}
              </p>
              <Button
                type="submit"
                className="w-full bg-brand hover:bg-brand/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Joining…' : 'Join group'}
              </Button>
            </form>
          ) : (
          <>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
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
              <Label htmlFor="email">Email</Label>
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
                <Phone className="h-3.5 w-3.5" /> WhatsApp phone
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 541138718498"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Include country code, no + sign.</p>
            </div>

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
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold"
              disabled={isSubmitting || !name.trim() || !email.trim() || !password}
            >
              {isSubmitting ? 'Joining…' : 'Create Account & Join'}
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
        </div>
      </div>
    </div>
  );
}
