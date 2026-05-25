import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { createInvitation, listInvitations, revokeInvitation } from '../api/invitations';
import { getJoinLink, rotateJoinLink } from '../api/joinLinks';
import type { Invitation, GroupJoinLink } from '../types/expense';

type InviteTab = 'email' | 'phone' | 'link';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function GroupMembers() {
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const { data: group, isLoading } = useGroup(groupId);

  const [activeTab, setActiveTab] = useState<InviteTab>('email');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  const [joinLink, setJoinLink] = useState<GroupJoinLink | null>(null);
  const [joinLinkLoading, setJoinLinkLoading] = useState(false);
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [joinLinkError, setJoinLinkError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const result = await listInvitations(groupId);
      setInvitations(result.filter(i => i.status === 'pending'));
    } catch {
      // silently ignore
    } finally {
      setInvitationsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    try {
      setIsSubmitting(true);
      setInviteError(null);
      setInviteSuccess(false);
      await createInvitation(groupId, { name: name.trim(), channel: activeTab as 'email' | 'phone', contact: contact.trim() });
      setInviteSuccess(true);
      setName('');
      setContact('');
      loadInvitations();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (token: string) => {
    try {
      await revokeInvitation(groupId, token);
      setInvitations(prev => prev.filter(i => i.shareUrl !== token && !i.shareUrl.endsWith(token)));
      loadInvitations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const handleGetLink = async () => {
    setJoinLinkLoading(true);
    setJoinLinkError(null);
    try {
      const link = await getJoinLink(groupId);
      setJoinLink(link);
    } catch (err) {
      setJoinLinkError(err instanceof Error ? err.message : 'Failed to get join link');
    } finally {
      setJoinLinkLoading(false);
    }
  };

  const handleRotateLink = async () => {
    setJoinLinkLoading(true);
    setJoinLinkError(null);
    try {
      const link = await rotateJoinLink(groupId);
      setJoinLink(link);
    } catch (err) {
      setJoinLinkError(err instanceof Error ? err.message : 'Failed to rotate join link');
    } finally {
      setJoinLinkLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink.url).then(() => {
      setJoinLinkCopied(true);
      setTimeout(() => setJoinLinkCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const tabClass = (tab: InviteTab) =>
    `px-4 py-2 text-sm font-medium rounded-t-md ${
      activeTab === tab
        ? 'bg-white text-blue-600 border border-b-white border-gray-200'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Members</h2>

        {/* Member list */}
        <div className="bg-white rounded-lg shadow divide-y mb-8">
          {group?.members.map(member => (
            <div key={member.memberId} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  {member.name}
                  {member.isStub && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </p>
                {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
                {member.telephone && !member.email && (
                  <p className="text-sm text-gray-500">{member.telephone}</p>
                )}
              </div>
            </div>
          ))}
          {!group?.members.length && (
            <p className="px-4 py-4 text-gray-500 text-sm">No members yet.</p>
          )}
        </div>

        {/* Invite panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Invite Member</h3>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            <button className={tabClass('email')} onClick={() => { setActiveTab('email'); setInviteError(null); setInviteSuccess(false); }}>
              By Email
            </button>
            <button className={tabClass('phone')} onClick={() => { setActiveTab('phone'); setInviteError(null); setInviteSuccess(false); }}>
              By Phone
            </button>
            <button className={tabClass('link')} onClick={() => { setActiveTab('link'); setInviteError(null); setInviteSuccess(false); }}>
              Share Link
            </button>
          </div>

          {activeTab !== 'link' ? (
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type={activeTab === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder={activeTab === 'email' ? 'Email address' : 'Phone (e.g. 541138718498)'}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !contact.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Inviting…' : 'Invite'}
                </button>
              </div>
              {inviteError && <p className="text-red-600 text-sm">{inviteError}</p>}
              {inviteSuccess && <p className="text-green-600 text-sm">Invitation sent!</p>}
            </form>
          ) : (
            <div className="space-y-3">
              {!joinLink ? (
                <button
                  onClick={handleGetLink}
                  disabled={joinLinkLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {joinLinkLoading ? 'Loading…' : 'Get Share Link'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={joinLink.url}
                      className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      {joinLinkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Unite al grupo: ${joinLink.url}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                    >
                      Share on WhatsApp
                    </a>
                    <button
                      onClick={handleRotateLink}
                      disabled={joinLinkLoading}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                      {joinLinkLoading ? 'Rotating…' : 'Rotate Link'}
                    </button>
                  </div>
                </div>
              )}
              {joinLinkError && <p className="text-red-600 text-sm">{joinLinkError}</p>}
            </div>
          )}
        </div>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Pending Invitations</h3>
            {invitationsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <ul className="divide-y">
                {invitations.map(inv => (
                  <li key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.target}</p>
                      <p className="text-xs text-gray-500">
                        via {inv.channel} · expires {formatDate(inv.expiresAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(inv.shareUrl.split('/').pop()!)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
