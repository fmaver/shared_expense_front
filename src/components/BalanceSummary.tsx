import React from 'react';
import { formatCurrency } from '../utils/format';
import type { Member } from '../types/expense';

interface BalanceSummaryProps {
  balances: Record<string, number>;
  members: Member[];
  isSettled: boolean;
  onSettle: () => void;
  isSettling: boolean;
}

export function BalanceSummary({ balances, members, isSettled, onSettle, isSettling }: BalanceSummaryProps) {
  const getMemberName = (id: string) => {
    return members.find(m => m.id === parseInt(id))?.name || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Monthly Balance</h3>
        {!isSettled && (
          <button
            onClick={onSettle}
            disabled={isSettling}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white 
              ${isSettling 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {isSettling ? 'Settling...' : 'Settle Balance'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {Object.entries(balances).map(([memberId, balance]) => (
          <div key={memberId} className="flex justify-between items-center">
            <span className="text-gray-700">{getMemberName(memberId)}</span>
            <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(balance)}
            </span>
          </div>
        ))}
      </div>
      {isSettled && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded">
          This month has been settled
        </div>
      )}
    </div>
  );
}