import React from 'react';
import { BalanceSummary } from './BalanceSummary';
import { ExpenseList } from './ExpenseList';
import { LoadingState } from './LoadingState';
import type { MonthlyBalanceResponse, Member } from '../types/expense';

interface ExpenseContentProps {
  isLoading: boolean;
  monthlyData: MonthlyBalanceResponse | null;
  members: Member[];
  onExpenseUpdated: () => void;
}

export function ExpenseContent({ isLoading, monthlyData, members, onExpenseUpdated }: ExpenseContentProps) {
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
      <BalanceSummary
        balances={monthlyData.balances}
        members={members}
        isSettled={monthlyData.isSettled}
      />
      <ExpenseList
        expenses={monthlyData.expenses}
        members={members}
        onExpenseUpdated={onExpenseUpdated}
      />
    </>
  );
}