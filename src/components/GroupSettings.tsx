import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { updateGroupName } from '../api/groups';

export function GroupSettings() {
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(groupId);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      setNameError(null);
      setNameSuccess(false);
      await updateGroupName(groupId, name.trim());
      setNameSuccess(true);
      setName('');
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to rename group');
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
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Group Settings</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Rename Group</h3>
          <p className="text-sm text-gray-500 mb-3">Current name: <strong>{group?.name}</strong></p>
          <form onSubmit={handleRename} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="New group name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </form>
          {nameError && <p className="text-red-600 text-sm mt-2">{nameError}</p>}
          {nameSuccess && <p className="text-green-600 text-sm mt-2">Group renamed!</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Leave Group</h3>
          <p className="text-sm text-gray-500 mb-4">
            You can only leave if your balance is settled.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    </div>
  );
}
