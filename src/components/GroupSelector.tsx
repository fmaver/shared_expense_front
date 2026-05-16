import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { CreateGroupModal } from './CreateGroupModal';
import type { Group } from '../types/expense';

interface GroupSelectorProps {
  onLogout: () => void;
}

export function GroupSelector({ onLogout }: GroupSelectorProps) {
  const navigate = useNavigate();
  const { data: groups, isLoading, error } = useGroups();
  const [showCreate, setShowCreate] = useState(false);

  const handleGroupCreated = (group: Group) => {
    setShowCreate(false);
    navigate(`/groups/${group.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Shared Expenses</h1>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Your Groups</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            + New Group
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">You don't belong to any group yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map(group => (
              <li key={group.id}>
                <button
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="w-full bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition-shadow flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <p className="text-sm text-gray-500">
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-gray-400 text-lg">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal onCreated={handleGroupCreated} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
