import React, { useState } from 'react';
import { formatCurrency, capitalize, formatDate } from '../utils/format';
import type { ExpenseResponse, Member, ExpenseCreate } from '../types/expense';
import { updateExpense, deleteExpense, recalculateMonthlyBalance } from '../api/expenses';
import { ExpenseForm } from './ExpenseForm';
import { Pen, Trash2, ArrowUpDown } from 'lucide-react';
import { Toast } from './Toast';

type SortField = 'date' | 'description' | 'amount' | 'category' | 'payer' | 'paymentType' | 'splitStrategy';
type SortOrder = 'asc' | 'desc';

interface ExpenseListProps {
  expenses: ExpenseResponse[];
  members: Member[];
  onExpenseUpdated: () => void;
  isSettled?: boolean;
}

export function ExpenseList({ expenses, members, onExpenseUpdated, isSettled = false }: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getMemberName = (id: number) => {
    return members.find(m => m.id === id)?.name || 'Unknown';
  };

  const handleEdit = (expense: ExpenseResponse) => {
    // Don't allow editing of non-first installments for credit expenses
    if (expense.installmentNo > 1) {
      alert('You can only edit the first installment of a credit expense. This will update all related installments.');
      return;
    }
    setEditingExpense(expense);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortExpenses = (expenses: ExpenseResponse[]) => {
    return [...expenses].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'payer':
          comparison = getMemberName(a.payerId).localeCompare(getMemberName(b.payerId));
          break;
        case 'paymentType':
          comparison = a.paymentType.localeCompare(b.paymentType);
          break;
        case 'splitStrategy':
          comparison = a.splitStrategy.type.localeCompare(b.splitStrategy.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleUpdate = async (updatedExpense: ExpenseCreate) => {
    if (!editingExpense || isUpdating) return;
    
    // If it's a credit expense with multiple installments, show a confirmation
    if (editingExpense.paymentType === 'credit' && editingExpense.installments > 1) {
      if (!window.confirm('This is a credit expense with multiple installments. Updating this will modify all related installments. Are you sure?')) {
        return;
      }
    }
    
    try {
      setIsUpdating(true);
      const result = await updateExpense(editingExpense.id, updatedExpense);
      if (!result.error && result.data) {
        onExpenseUpdated();
        setEditingExpense(null);
        setToast({ message: 'Expense updated successfully!', type: 'success' });
      } else {
        throw new Error(result.error || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to update expense',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleDelete = async (expense: ExpenseResponse) => {
    // Don't allow deletion of non-first installments for credit expenses
    if (expense.installmentNo > 1) {
      alert('You can only delete the first installment of a credit expense. This will delete all related installments.');
      return;
    }

    // If it's a credit expense with multiple installments, we need to find the parent expense
    const expenseToDelete = expense.parentExpenseId || expense.id;
    
    const message = expense.installments > 1 
      ? 'This is a credit expense with multiple installments. Deleting this will remove all related installments. Are you sure?'
      : 'Are you sure you want to delete this expense?';

    if (window.confirm(message)) {
      try {
        const result = await deleteExpense(expenseToDelete);
        if (result.success) {
          onExpenseUpdated();
        } else {
          throw new Error(result.error || 'Failed to delete expense');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete expense');
      }
    }
  };

  const handleRecalculate = async () => {
    console.log('Recalculate button clicked');
    // Extract year and month from the first expense
    if (expenses.length === 0) {
      console.log('No expenses found');
      return;
    }
    
    const date = new Date(expenses[0].date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    console.log('Recalculating for:', { year, month, date: expenses[0].date });

    try {
      console.log('Calling recalculateMonthlyBalance...');
      const result = await recalculateMonthlyBalance(year, month);
      console.log('Recalculate result:', result);
      if (result.success) {
        onExpenseUpdated();
        setToast({ message: 'Balances recalculated successfully!', type: 'success' });
      } else {
        throw new Error(result.error || 'Failed to recalculate balance');
      }
    } catch (error) {
      console.error('Error recalculating balance:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to recalculate balance',
        type: 'error'
      });
    }
  };

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              mode="edit"
              initialExpense={editingExpense}
              onSubmit={handleUpdate}
              members={members}
              onCancel={handleCancelEdit}
              isSettled={isSettled}
            />
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Date</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('description')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Description</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('amount')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Amount</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('category')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Category</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('payer')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Payer</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('paymentType')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Payment</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('splitStrategy')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Split</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortExpenses(expenses).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {formatDate(expense.date, true)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {capitalize(expense.description)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="group relative inline-flex items-center">
                      <span className={`cursor-${expense.paymentType === 'credit' && expense.installments > 1 ? 'help' : 'default'}`}>
                        {formatCurrency(expense.amount)}
                      </span>
                      {expense.paymentType === 'credit' && expense.installments > 1 && (
                        <div className="invisible group-hover:visible absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                          Total: {formatCurrency(expense.amount * expense.installments)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {capitalize(expense.category)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {getMemberName(expense.payerId)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.paymentType === 'credit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {capitalize(expense.paymentType)}
                      {expense.paymentType === 'credit' && expense.installments > 1 && 
                        ` (${expense.installmentNo}/${expense.installments})`}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.splitStrategy.type === 'equal' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {capitalize(expense.splitStrategy.type)}
                      </span>
                    ) : (
                      <div className="text-xs space-y-1">
                        {Object.entries(expense.splitStrategy.percentages || {}).map(([memberId, percentage]) => {
                          const amount = (expense.amount * (percentage || 0)) / 100;
                          return (
                            <div key={memberId} className="flex items-center space-x-1 group relative">
                              <span className="font-medium">{getMemberName(parseInt(memberId))}:</span>
                              <span className="cursor-help">{percentage}%</span>
                              <div className="invisible group-hover:visible absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                                {formatCurrency(amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {!isSettled && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className={`text-blue-600 hover:text-blue-800 ${
                            expense.installmentNo > 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={expense.installmentNo > 1}
                          title={
                            expense.installmentNo > 1
                              ? 'You can only edit the first installment of a credit expense'
                              : 'Edit expense'
                          }
                        >
                          <Pen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense)}
                          className={`text-red-600 hover:text-red-800 ${
                            expense.installmentNo > 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={expense.installmentNo > 1}
                          title={
                            expense.installmentNo > 1
                              ? 'You can only delete the first installment of a credit expense'
                              : 'Delete expense'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}