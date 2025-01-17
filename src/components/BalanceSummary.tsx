import React from 'react';
import { formatCurrency } from '../utils/format';
import { RefreshCw } from 'lucide-react';
import type { Member, ExpenseResponse } from '../types/expense';

interface BalanceSummaryProps {
  balances: Record<string, number>;
  members: Member[];
  isSettled: boolean;
  onSettle: () => void;
  isSettling: boolean;
  onRecalculate: () => void;
  isRecalculating: boolean;
  expenses: ExpenseResponse[];
}

export function BalanceSummary({ 
  balances, 
  members, 
  isSettled, 
  onSettle, 
  isSettling,
  onRecalculate,
  isRecalculating,
  expenses
}: BalanceSummaryProps) {
  const getMemberName = (id: string) => {
    return members.find(m => m.id === parseInt(id))?.name || 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Monthly Balance</h2>
        <div className="flex space-x-2">
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
          {!isSettled && (
            <button
              onClick={onSettle}
              disabled={isSettling}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettling ? 'Settling...' : 'Settle Balance'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(balances).map(([memberId, balance]) => (
          <div key={memberId} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">{getMemberName(memberId)}</span>
            <span
              className={`text-sm font-medium ${
                balance > 0
                  ? 'text-green-600'
                  : balance < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {formatCurrency(balance)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">Total Monthly Expenses</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
      </div>

      {isSettled && (
        <div className="mt-4 text-sm text-green-600 font-medium">
          Monthly Share Settled
        </div>
      )}
    </div>
  );
}