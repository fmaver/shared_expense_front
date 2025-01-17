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
import { FormModal } from './components/FormModal';

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
          onAddExpense={() => setShowForm(true)}
          onAddTransfer={() => setShowTransferForm(true)}
          showForm={showForm}
          showTransferForm={showTransferForm}
          monthlyData={monthlyData}
          members={members || []}
        />

        <MonthPicker
          year={year}
          month={month}
          onNavigate={handleMonthChange}
        />

        {isLoadingExpenses ? (
          <LoadingState message="Loading expenses..." />
        ) : (
          <ExpenseContent
            isLoading={isLoadingExpenses}
            monthlyData={monthlyData}
            members={members || []}
            onExpenseUpdated={refreshMonthlyData}
          />
        )}

        {showForm && members && (
          <FormModal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setCreateExpenseError(null);
            }}
            title="Add Expense"
            error={createExpenseError}
          >
            <ExpenseForm 
              onSubmit={handleCreateExpense} 
              members={members}
              onCancel={() => {
                setShowForm(false);
                setCreateExpenseError(null);
              }}
            />
          </FormModal>
        )}

        {showTransferForm && members && (
          <FormModal
            isOpen={showTransferForm}
            onClose={() => {
              setShowTransferForm(false);
              setCreateExpenseError(null);
            }}
            title="Add Money Transfer"
            error={createExpenseError}
          >
            <MoneyTransferForm
              onSubmit={handleCreateExpense}
              members={members}
              onCancel={() => {
                setShowTransferForm(false);
                setCreateExpenseError(null);
              }}
            />
          </FormModal>
        )}
      </div>
    </div>
  );
}