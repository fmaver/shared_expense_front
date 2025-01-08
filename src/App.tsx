import React, { useState } from 'react';
import { ExpenseForm } from './components/ExpenseForm';
import { MoneyTransferForm } from './components/MoneyTransferForm';
import { MonthPicker } from './components/MonthPicker';
import { ExpenseHeader } from './components/ExpenseHeader';
import { ExpenseContent } from './components/ExpenseContent';
import { LoadingState } from './components/LoadingState';
import { useMonthlyBalance } from './hooks/useMonthlyBalance';
import { useMembers } from './hooks/useMembers';
import { createExpense } from './api/expenses';
import type { ExpenseCreate } from './types/expense';

export function App() {
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [createExpenseError, setCreateExpenseError] = useState<string | null>(null);
  
  const { data: members, isLoading: isLoadingMembers } = useMembers();
  const { 
    data: monthlyData, 
    isLoading: isLoadingExpenses,
    error: expensesError,
    refetch: refreshMonthlyData
  } = useMonthlyBalance(year, month);

  const handleCreateExpense = async (expenseData: ExpenseCreate) => {
    try {
      setCreateExpenseError(null);
      const { data: result, error } = await createExpense(expenseData);
      
      if (error) {
        throw new Error(error);
      } else if (result) {
        setShowForm(false);
        setShowTransferForm(false);
        refreshMonthlyData();
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      setCreateExpenseError(error instanceof Error ? error.message : 'Failed to create expense');
    }
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleAddExpense = () => {
    setShowForm(!showForm);
    setShowTransferForm(false);
    setCreateExpenseError(null);
  };

  const handleAddTransfer = () => {
    setShowTransferForm(!showTransferForm);
    setShowForm(false);
    setCreateExpenseError(null);
  };

  if (isLoadingMembers) {
    return <LoadingState message="Loading members..." />;
  }

  if (expensesError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg shadow">
          <p>Error: {expensesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <ExpenseHeader 
          onAddExpense={handleAddExpense}
          onAddTransfer={handleAddTransfer}
          showForm={showForm}
          showTransferForm={showTransferForm}
        />

        <MonthPicker
          year={year}
          month={month}
          onNavigate={handleMonthChange}
        />

        {createExpenseError && (
          <div className="mb-4 bg-red-50 text-red-800 p-4 rounded-lg shadow">
            <p>{createExpenseError}</p>
          </div>
        )}

        {showForm && members && (
          <div className="mb-8">
            <ExpenseForm 
              onSubmit={handleCreateExpense} 
              members={members} 
            />
          </div>
        )}

        {showTransferForm && members && (
          <div className="mb-8">
            <MoneyTransferForm
              onSubmit={handleCreateExpense}
              members={members}
              onCancel={handleAddTransfer}
            />
          </div>
        )}

        <ExpenseContent 
          isLoading={isLoadingExpenses}
          monthlyData={monthlyData}
          members={members}
          onExpenseUpdated={refreshMonthlyData}
        />
      </div>
    </div>
  );
}