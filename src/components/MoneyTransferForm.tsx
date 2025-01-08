import React, { useState } from 'react';
import { Calendar, DollarSign, Users, Tag } from 'lucide-react';
import type { ExpenseCreate, Member } from '../types/expense';

interface MoneyTransferFormProps {
  onSubmit: (expense: ExpenseCreate) => void;
  members: Member[];
  onCancel?: () => void;
}

export function MoneyTransferForm({ onSubmit, members, onCancel }: MoneyTransferFormProps) {
  const [transfer, setTransfer] = useState<Partial<ExpenseCreate>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    payerId: members[0]?.id || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a complete expense object with the transfer data
    const expenseData: ExpenseCreate = {
      ...transfer,
      category: { name: 'prestamo' },
      paymentType: 'debit',
      installments: 1,
      splitStrategy: {
        type: 'percentage',
        percentages: Object.fromEntries(
          members.map(m => [m.id, m.id === transfer.payerId ? 0 : 100 / (members.length - 1)])
        )
      }
    } as ExpenseCreate;

    onSubmit(expenseData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Money Transfer</h2>
      
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
              value={transfer.amount}
              onChange={(e) => setTransfer({ ...transfer, amount: parseFloat(e.target.value) })}
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
              value={transfer.description}
              onChange={(e) => setTransfer({ ...transfer, description: e.target.value })}
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
              value={transfer.date}
              onChange={(e) => setTransfer({ ...transfer, date: e.target.value })}
            />
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
              value={transfer.payerId}
              onChange={(e) => setTransfer({ ...transfer, payerId: parseInt(e.target.value) })}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
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
          Create Transfer
        </button>
      </div>
    </form>
  );
}
