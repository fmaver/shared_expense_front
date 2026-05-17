import React, { useState } from 'react';
import { ExpenseList } from './ExpenseList';
import { BalanceSummary } from './BalanceSummary';
import { LoadingState } from './LoadingState';
import { ConfirmationModal } from './ConfirmationModal';
import { settleMonthlyBalance } from '../api/expenses';
import { recalculateMonthlyShare, unsettleMonthlyShare } from '../api/shares';
import type { MonthlyBalanceResponse, Member } from '../types/expense';

interface ExpenseContentProps {
  groupId: number;
  isLoading: boolean;
  monthlyData: MonthlyBalanceResponse | null;
  members: Member[];
  onExpenseUpdated: () => void;
}

export function ExpenseContent({ groupId, isLoading, monthlyData, members, onExpenseUpdated }: ExpenseContentProps) {
  const [isSettling, setIsSettling] = useState(false);
  const [isUnsettling, setIsUnsettling] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showSettleConfirmation, setShowSettleConfirmation] = useState(false);
  const [showUnsettleConfirmation, setShowUnsettleConfirmation] = useState(false);

  const handleSettle = async () => {
    if (!monthlyData || isSettling) return;
    try {
      setIsSettling(true);
      const result = await settleMonthlyBalance(groupId, monthlyData.year, monthlyData.month);
      if (result.success) {
        onExpenseUpdated();
        setShowSettleConfirmation(false);
      } else {
        throw new Error(result.error || 'Failed to settle balance');
      }
    } catch (error) {
      console.error('Error settling balance:', error);
    } finally {
      setIsSettling(false);
    }
  };

  const handleUnsettle = async () => {
    if (!monthlyData || isUnsettling) return;
    try {
      setIsUnsettling(true);
      const result = await unsettleMonthlyShare(groupId, monthlyData.year, monthlyData.month);
      if (result) {
        onExpenseUpdated();
        setShowUnsettleConfirmation(false);
      } else {
        throw new Error('Failed to reopen month');
      }
    } catch (error) {
      console.error('Error unsettling month:', error);
    } finally {
      setIsUnsettling(false);
    }
  };

  const handleRecalculate = async () => {
    if (!monthlyData || isRecalculating) return;
    try {
      setIsRecalculating(true);
      const result = await recalculateMonthlyShare(groupId, monthlyData.year, monthlyData.month);
      if (result.success) {
        onExpenseUpdated();
      } else {
        throw new Error(result.error || 'Failed to recalculate balance');
      }
    } catch (error) {
      console.error('Error recalculating balance:', error);
    } finally {
      setIsRecalculating(false);
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
    <div className="space-y-8">
      {monthlyData && (
        <>
          <BalanceSummary
            balances={monthlyData.balances}
            members={members}
            isSettled={monthlyData.isSettled}
            onSettle={() => setShowSettleConfirmation(true)}
            isSettling={isSettling}
            onUnsettle={() => setShowUnsettleConfirmation(true)}
            isUnsettling={isUnsettling}
            onRecalculate={handleRecalculate}
            isRecalculating={isRecalculating}
            expenses={monthlyData.expenses}
          />

          <ExpenseList
            groupId={groupId}
            expenses={monthlyData.expenses}
            members={members}
            onExpenseUpdated={onExpenseUpdated}
            isSettled={monthlyData.isSettled}
          />
        </>
      )}

      <ConfirmationModal
        isOpen={showSettleConfirmation}
        onConfirm={handleSettle}
        onCancel={() => setShowSettleConfirmation(false)}
        title="Settle Monthly Balance"
        message="Are you sure you want to settle this month's balance? This action cannot be undone."
        confirmText={isSettling ? "Settling..." : "Settle Balance"}
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showUnsettleConfirmation}
        onConfirm={handleUnsettle}
        onCancel={() => setShowUnsettleConfirmation(false)}
        title="Reopen Month"
        message="This will delete the auto-generated balancing expenses and mark the month as unsettled. Manual loan expenses are kept. Are you sure?"
        confirmText={isUnsettling ? "Reopening..." : "Reopen Month"}
        cancelText="Cancel"
      />
    </div>
  );
}
