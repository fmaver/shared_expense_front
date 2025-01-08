import React, { useState } from 'react';
import { formatCurrency } from '../utils/format';
import type { ExpenseResponse, Member, ExpenseCreate } from '../types/expense';
import { updateExpense, deleteExpense } from '../api/expenses';
import { ExpenseForm } from './ExpenseForm';
import { Pen, Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: ExpenseResponse[];
  members: Member[];
  onExpenseUpdated: () => void;
}

export function ExpenseList({ expenses, members, onExpenseUpdated }: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getMemberName = (id: number) => {
    return members.find(m => m.id === id)?.name || 'Unknown';
  };

  const handleEdit = (expense: ExpenseResponse) => {
    setEditingExpense(expense);
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
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              onSubmit={handleUpdate}
              members={members}
              initialExpense={editingExpense}
              mode="edit"
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Split</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMemberName(expense.payerId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.paymentType === 'credit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {expense.paymentType}
                      {expense.paymentType === 'credit' && expense.installments > 1 && 
                        ` (${expense.installmentNo}/${expense.installments})`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.splitStrategy.type === 'equal' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Equal
                      </span>
                    ) : (
                      <div className="text-xs space-y-1">
                        {members.map(member => (
                          <div key={member.id} className="flex items-center space-x-1">
                            <span className="font-medium">{member.name}:</span>
                            <span>{expense.splitStrategy.percentages?.[member.id]}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="inline-flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit expense"
                    >
                      <Pen size={18} />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 size={18} />
                      <span className="sr-only">Delete</span>
                    </button>
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