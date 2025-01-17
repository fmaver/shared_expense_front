import React, { useState } from 'react';
import { formatCurrency, capitalize, formatDate } from '../utils/format';
import type { ExpenseResponse, Member, ExpenseCreate } from '../types/expense';
import { updateExpense, deleteExpense } from '../api/expenses';
import { ExpenseForm } from './ExpenseForm';
import { Pen, Trash2, ArrowUpDown } from 'lucide-react';

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

  const getMemberName = (id: number) => {
    return members.find(m => m.id === id)?.name || 'Unknown';
  };

  const handleEdit = (expense: ExpenseResponse) => {
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
    
    try {
      setIsUpdating(true);
      const result = await updateExpense(editingExpense.id, updatedExpense);
      if (!result.error && result.data) {
        onExpenseUpdated();
        setEditingExpense(null);
      } else {
        throw new Error(result.error || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert(error instanceof Error ? error.message : 'Failed to update expense');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleDelete = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const result = await deleteExpense(expenseId);
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

  return (
    <div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        disabled={isSettled}
                        className={`p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isSettled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Pen className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={isSettled}
                        className={`p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isSettled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
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