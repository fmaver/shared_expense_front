import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveInvitation, acceptInvitation } from '../api/invitations';
import type { InvitationResolveResponse } from '../types/expense';

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

  const [submitError, setSubmitError] = useState<string | null>(null);
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
      setSubmitError(null);
      const result = await acceptInvitation(token, {});
      onLoginSuccess(result.accessToken);
      setAccepted(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to accept invitation');
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
      setSubmitError(null);
      const result = await acceptInvitation(token, {
        ...(info?.requiresEmail ? { email: email.trim() } : {}),
        password,
      });
      onLoginSuccess(result.accessToken);
      navigate('/');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <p className="text-red-600 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <p className="text-gray-600">{messages[info.status] ?? 'This invitation is no longer valid.'}</p>
        </div>
      </div>
    );
  }

  const header = (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">You're invited!</h1>
      <p className="text-gray-600 text-sm">
        <strong>{info.inviterName}</strong> invited you to join <strong>{info.groupName}</strong>.
      </p>
    </div>
  );

  // --- Existing member path ---
  if (info.isExistingMember) {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
            {header}
            <p className="text-gray-600 text-sm mb-4">
              Log in with your existing account to accept this invitation.
            </p>
            <button
              onClick={() => navigate(`/login?redirect=/invite/${token}`)}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Log in to accept
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          {header}
          {accepted ? (
            <p className="text-green-600 text-sm font-medium">✅ Joined! Redirecting…</p>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-4">
                You already have an account. Click below to join <strong>{info.groupName}</strong>.
              </p>
              {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}
              <button
                onClick={handleExistingAccept}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Joining…' : 'Accept & Join'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- New user (stub) path: create account ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        {header}
        <p className="text-gray-600 text-sm mb-4">Create your account to join the group.</p>
        <form onSubmit={handleStubAccept} className="space-y-4">
          {info.requiresEmail ? (
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <p className="text-sm text-gray-700">{info.knownEmail}</p>
            </div>
          )}

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Choose a password"
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account…' : 'Create account & Join'}
          </button>
        </form>
      </div>
    </div>
  );
}
