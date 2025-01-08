import React from 'react';

interface ExpenseHeaderProps {
  onAddExpense: () => void;
  showForm: boolean;
}

export function ExpenseHeader({ onAddExpense, showForm }: ExpenseHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
      <button
        onClick={onAddExpense}
        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {showForm ? 'Cancel' : 'Add Expense'}
      </button>
    </div>
  );
}