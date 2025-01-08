import React, { useState } from 'react';
import { BalanceSummary } from './BalanceSummary';
import { ExpenseList } from './ExpenseList';
import { LoadingState } from './LoadingState';
import { ConfirmationModal } from './ConfirmationModal';
import { settleMonthlyBalance } from '../api/expenses';
import type { MonthlyBalanceResponse, Member } from '../types/expense';

interface ExpenseContentProps {
  isLoading: boolean;
  monthlyData: MonthlyBalanceResponse | null;
  members: Member[];
  onExpenseUpdated: () => void;
}

export function ExpenseContent({ isLoading, monthlyData, members, onExpenseUpdated }: ExpenseContentProps) {
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [showSettleConfirmation, setShowSettleConfirmation] = useState(false);

  const handleSettle = async () => {
    if (!monthlyData || isSettling) return;

    try {
      setIsSettling(true);
      setSettleError(null);
      const result = await settleMonthlyBalance(monthlyData.year, monthlyData.month);
      
      if (result.success) {
        onExpenseUpdated();
        setShowSettleConfirmation(false);
      } else {
        throw new Error(result.error || 'Failed to settle balance');
      }
    } catch (error) {
      console.error('Error settling balance:', error);
      setSettleError(error instanceof Error ? error.message : 'Failed to settle balance');
    } finally {
      setIsSettling(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading expenses..." />;
  }

  if (!monthlyData) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-gray-600">No expenses found for this month.</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showSettleConfirmation}
        onConfirm={handleSettle}
        onCancel={() => setShowSettleConfirmation(false)}
        title="Settle Monthly Balance"
        message="Are you sure you want to settle this month's balance? This action cannot be undone."
        confirmText={isSettling ? "Settling..." : "Settle Balance"}
        cancelText="Cancel"
      />
      
      {settleError && (
        <div className="mb-4 bg-red-50 text-red-800 p-4 rounded-lg shadow">
          <p>{settleError}</p>
        </div>
      )}
      <BalanceSummary
        balances={monthlyData.balances}
        members={members}
        isSettled={monthlyData.isSettled}
        onSettle={() => setShowSettleConfirmation(true)}
        isSettling={isSettling}
      />
      <ExpenseList
        expenses={monthlyData.expenses}
        members={members}
        onExpenseUpdated={onExpenseUpdated}
      />
    </>
  );
}