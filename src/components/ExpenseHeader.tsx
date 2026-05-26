import React, { useState } from 'react';
import { Plus, ArrowRightLeft, Download, Loader2 } from 'lucide-react';
import { downloadMonthlyPdf } from '../api/shares';
import type { MonthlyBalanceResponse } from '../types/expense';

interface ExpenseHeaderProps {
  onAddExpense: () => void;
  onAddTransfer: () => void;
  showForm: boolean;
  showTransferForm: boolean;
  monthlyData?: MonthlyBalanceResponse;
  groupId: number;
  year: number;
  month: number;
}

export function ExpenseHeader({
  onAddExpense,
  onAddTransfer,
  showForm,
  showTransferForm,
  monthlyData,
  groupId,
  year,
  month,
}: ExpenseHeaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const showingAnyForm = showForm || showTransferForm;
  const currentFormIsExpense = showForm;

  const handleDownload = async () => {
    if (!monthlyData || isDownloading) return;
    try {
      setIsDownloading(true);
      await downloadMonthlyPdf(groupId, year, month);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

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
              onClick={handleDownload}
              disabled={!monthlyData || isDownloading}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {isDownloading ? 'Generando...' : 'Export PDF'}
            </button>
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