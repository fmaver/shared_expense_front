import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { inviteMember } from '../api/groups';

export function GroupMembers() {
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const { data: group, isLoading } = useGroup(groupId);

  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setIsSubmitting(true);
      setInviteError(null);
      setInviteSuccess(false);
      await inviteMember(groupId, email.trim());
      setInviteSuccess(true);
      setEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Members</h2>

        <div className="bg-white rounded-lg shadow divide-y mb-8">
          {group?.members.map(member => (
            <div key={member.memberId} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>
          ))}
          {!group?.members.length && (
            <p className="px-4 py-4 text-gray-500 text-sm">No members yet.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Invite Member</h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
          {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
          {inviteSuccess && (
            <p className="text-green-600 text-sm mt-2">Member invited successfully!</p>
          )}
        </div>
      </div>
    </div>
  );
}
