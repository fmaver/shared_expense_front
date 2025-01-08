import React, { useState } from 'react';
import { Calendar, DollarSign, Users, Tag, CreditCard } from 'lucide-react';
import type { ExpenseCreate, ExpenseResponse, Member } from '../types/expense';
import { useCategories } from '../hooks/useCategories';

interface ExpenseFormProps {
  onSubmit: (expense: ExpenseCreate) => void;
  members: Member[];
  initialExpense?: ExpenseResponse;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
}

export function ExpenseForm({ onSubmit, members, initialExpense, mode = 'create', onCancel }: ExpenseFormProps) {
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const [expense, setExpense] = useState<ExpenseCreate>(() => {
    if (initialExpense) {
      return {
        description: initialExpense.description,
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
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: { name: categories?.[0]?.name || '' },
      payerId: members[0]?.id || 0,
      paymentType: 'debit',
      installments: 1,
      splitStrategy: { type: 'equal' }
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...expense,
      splitStrategy: {
        type: expense.splitStrategy.type,
        ...(expense.splitStrategy.type === 'percentage' 
          ? { percentages: expense.splitStrategy.percentages }
          : {})
      }
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.amount}
              onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.date}
              onChange={(e) => setExpense({ ...expense, date: e.target.value })}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.category.name}
              onChange={(e) => setExpense({ ...expense, category: { name: e.target.value } })}
              disabled={isLoadingCategories}
            >
              <option value="">Select a category</option>
              {categories && categories.length > 0 && categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.payerId}
              onChange={(e) => setExpense({ ...expense, payerId: parseInt(e.target.value) })}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.paymentType}
              onChange={(e) => setExpense({ ...expense, paymentType: e.target.value as 'debit' | 'credit' })}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={expense.splitStrategy.type}
              onChange={(e) => setExpense({
                ...expense,
                splitStrategy: { 
                  type: e.target.value as 'equal' | 'percentage',
                  percentages: e.target.value === 'percentage' 
                    ? Object.fromEntries(members.map(m => [m.id.toString(), 0]))
                    : null 
                }
              })}
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
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={expense.splitStrategy.percentages?.[member.id] || 0}
                    onChange={(e) => {
                      const newPercentages = {
                        ...expense.splitStrategy.percentages,
                        [member.id]: parseFloat(e.target.value)
                      };
                      setExpense({
                        ...expense,
                        splitStrategy: {
                          ...expense.splitStrategy,
                          percentages: newPercentages
                        }
                      });
                    }}
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={expense.installments}
                onChange={(e) => setExpense({ ...expense, installments: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {mode === 'create' ? 'Create Expense' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}