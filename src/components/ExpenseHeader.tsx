import React from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';

interface ExpenseHeaderProps {
  onAddExpense: () => void;
  onAddTransfer: () => void;
  showForm: boolean;
  showTransferForm: boolean;
}

export function ExpenseHeader({ onAddExpense, onAddTransfer, showForm, showTransferForm }: ExpenseHeaderProps) {
  const showingAnyForm = showForm || showTransferForm;
  const currentFormIsExpense = showForm;

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
      <div className="flex space-x-4">
        {showingAnyForm ? (
          <button
            onClick={currentFormIsExpense ? onAddExpense : onAddTransfer}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors inline-flex items-center"
          >
            Cancel
          </button>
        ) : (
          <>
            <button
              onClick={onAddTransfer}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors inline-flex items-center"
            >
              <ArrowRightLeft className="w-5 h-5 mr-2" />
              Money Transfer
            </button>
            <button
              onClick={onAddExpense}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Expense
            </button>
          </>
        )}
      </div>
    </div>
  );
}