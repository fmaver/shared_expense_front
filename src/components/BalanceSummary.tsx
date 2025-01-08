import React from 'react';
import { formatCurrency } from '../utils/format';
import type { Member } from '../types/expense';

interface BalanceSummaryProps {
  balances: Record<string, number>;
  members: Member[];
  isSettled: boolean;
}

export function BalanceSummary({ balances, members, isSettled }: BalanceSummaryProps) {
  const getMemberName = (id: string) => {
    return members.find(m => m.id === parseInt(id))?.name || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Monthly Balance</h3>
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