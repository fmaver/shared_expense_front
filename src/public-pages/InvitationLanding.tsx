import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveInvitation, acceptInvitation } from '@/api/invitations';
import type { InvitationResolveResponse } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

interface Props {
  onLoginSuccess: (token: string) => void;
}

export function InvitationLanding({ onLoginSuccess }: Props) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

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
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Invalid invitation link'));
  }, [token]);

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
      toast.success('Joined! Redirecting…');
      setTimeout(() => navigate('/groups'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
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
      toast.success('Account created! Welcome aboard.');
      navigate('/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
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

  if (info.status !== 'pending') {
    const messages: Record<string, string> = {
      expired: 'This invitation has expired.',
      revoked: 'This invitation was revoked.',
      accepted: 'This invitation has already been accepted.',
    };
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {brandHeader}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">
              {messages[info.status] ?? 'This invitation is no longer valid.'}
            </p>
          </div>
        </div>
      </div>
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {brandHeader}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-1">You're invited!</h2>
            {inviteContext}
            <p className="text-sm text-muted-foreground mb-4">
              Log in with your existing account to accept this invitation.
            </p>
            <Button
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold"
              onClick={() => navigate(`/login?redirect=/invite/${token}`)}
            >
              Log in to accept
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Existing member: logged in ---
  if (info.isExistingMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {brandHeader}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-1">You're invited!</h2>
            {inviteContext}
            {accepted ? (
              <p className="text-sm text-brand font-medium">Joined! Redirecting…</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  You already have an account. Click below to join{' '}
                  <span className="font-semibold text-foreground">{info.groupName}</span>.
                </p>
                <Button
                  className="w-full bg-brand hover:bg-brand/90 text-white font-semibold"
                  onClick={handleExistingAccept}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining…' : 'Accept & Join'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- New user (stub): create account ---
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {brandHeader}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-1">You're invited!</h2>
          {inviteContext}
          <p className="text-sm text-muted-foreground mb-4">Create your account to join the group.</p>

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
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? 'Creating account…' : 'Create account & Join'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
