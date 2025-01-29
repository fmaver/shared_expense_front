import React, { useState } from 'react';
import { Calendar, DollarSign, Users, Tag, CreditCard } from 'lucide-react';
import type { ExpenseCreate, ExpenseResponse, Member } from '../types/expense';
import { useCategories } from '../hooks/useCategories';
import { formatDate } from '../utils/format';

interface ExpenseFormProps {
  onSubmit: (expense: ExpenseCreate) => void;
  members: Member[];
  initialExpense?: ExpenseResponse;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  isSettled?: boolean;
}

export function ExpenseForm({ onSubmit, members, initialExpense, mode = 'create', onCancel, isSettled = false }: ExpenseFormProps) {
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const [expense, setExpense] = useState<ExpenseCreate>(() => {
    if (initialExpense) {
      // Remove the installment suffix from the description if it exists
      const description = initialExpense.description.replace(/\s*\(\d+\/\d+\)\s*$/, '');
      
      return {
        description,
        amount: initialExpense.amount,
        date: initialExpense.date,
        category: { name: initialExpense.category },
        payerId: initialExpense.payerId,
        paymentType: initialExpense.paymentType,
        installments: initialExpense.installments,
        splitStrategy: {
          type: initialExpense.splitStrategy.type,
          ...(initialExpense.splitStrategy.type === 'percentage' 
            ? { percentages: initialExpense.splitStrategy.percentages }
            : {})
        }
      };
    }
    return {
      description: '',
      amount: '',
      date: formatDate(new Date()),
      category: { name: categories?.[0]?.name || '' },
      payerId: members[0]?.id || 0,
      paymentType: 'debit',
      installments: 1,
      splitStrategy: { 
        type: 'equal',
        percentages: {}
      }
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...expense,
      splitStrategy: {
        type: expense.splitStrategy.type,
        ...(expense.splitStrategy.type === 'percentage' 
          ? { 
              percentages: Object.fromEntries(
                Object.entries(expense.splitStrategy.percentages || {}).map(([key, value]) => [
                  key, 
                  value === null ? 0 : value
                ])
              )
            }
          : {})
      }
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{mode === 'create' ? 'New Expense' : 'Edit Expense'}</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <DollarSign className="text-gray-400" size={20} />
          <div className="flex-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.amount}
              onChange={(e) => setExpense({ ...expense, amount: e.target.value ? parseFloat(e.target.value) : '' })}
              disabled={isSettled}
              placeholder="e.g., 42.50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Tag className="text-gray-400" size={20} />
          <div className="flex-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              id="description"
              required
              maxLength={255}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              disabled={isSettled}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Calendar className="text-gray-400" size={20} />
          <div className="flex-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.date}
              onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              disabled={isSettled}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Tag className="text-gray-400" size={20} />
          <div className="flex-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.category.name}
              onChange={(e) => setExpense({ ...expense, category: { name: e.target.value } })}
              disabled={isLoadingCategories || isSettled}
            >
              <option value="">Select a category</option>
              {!isLoadingCategories && categories && categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
            {isLoadingCategories && (
              <p className="mt-1 text-sm text-gray-500">Loading categories...</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Users className="text-gray-400" size={20} />
          <div className="flex-1">
            <label htmlFor="payer" className="block text-sm font-medium text-gray-700">
              Payer
            </label>
            <select
              id="payer"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.payerId}
              onChange={(e) => setExpense({ ...expense, payerId: parseInt(e.target.value) })}
              disabled={isSettled}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <CreditCard className="text-gray-400" size={20} />
          <div className="flex-1">
            <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              id="paymentType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.paymentType}
              onChange={(e) => setExpense({ ...expense, paymentType: e.target.value as 'debit' | 'credit' })}
              disabled={isSettled}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="splitType" className="block text-sm font-medium text-gray-700">
              Split Type
            </label>
            <select
              id="splitType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={expense.splitStrategy.type}
              onChange={(e) => setExpense({
                ...expense,
                splitStrategy: { 
                  type: e.target.value as 'equal' | 'percentage',
                  percentages: e.target.value === 'percentage' 
                    ? Object.fromEntries(members.map(m => [m.id.toString(), null]))
                    : null 
                }
              })}
              disabled={isSettled}
            >
              <option value="equal">Equal</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
        </div>

        {expense.splitStrategy.type === 'percentage' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Member Percentages
            </label>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <span className="w-32">{member.name}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    placeholder="e.g., 50.00"
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none caret-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={expense.splitStrategy.percentages?.[member.id] === null ? '' : expense.splitStrategy.percentages?.[member.id]}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseFloat(e.target.value);
                      const newPercentages = {
                        ...expense.splitStrategy.percentages,
                        [member.id]: value
                      };
                      setExpense({
                        ...expense,
                        splitStrategy: {
                          ...expense.splitStrategy,
                          percentages: newPercentages
                        }
                      });
                    }}
                    disabled={isSettled}
                  />
                  <span>%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expense.paymentType === 'credit' && (
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="installments" className="block text-sm font-medium text-gray-700">
                Installments
              </label>
              <input
                type="number"
                id="installments"
                min="1"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none caret-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={expense.installments}
                onChange={(e) => setExpense({ ...expense, installments: parseInt(e.target.value) })}
                disabled={isSettled}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSettled}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSettled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {mode === 'create' ? 'Create Expense' : 'Update Expense'}
        </button>
      </div>
    </form>
  );
}