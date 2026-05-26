import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExpenseForm } from './ExpenseForm';
import { MoneyTransferForm } from './MoneyTransferForm';
import { MonthPicker } from './MonthPicker';
import { ExpenseHeader } from './ExpenseHeader';
import { ExpenseContent } from './ExpenseContent';
import { LoadingState } from './LoadingState';
import { FormModal } from './FormModal';
import { useMonthlyBalance } from '../hooks/useMonthlyBalance';
import { useGroupMembers } from '../hooks/useMembers';
import { checkSimilarExpenses, createExpense } from '../api/expenses';
import { ConfirmationModal } from './ConfirmationModal';
import type { ExpenseCreate, ExpenseResponse } from '../types/expense';

export function ExpensesDashboard() {
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);

  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [createExpenseError, setCreateExpenseError] = useState<string | null>(null);
  const [pendingExpense, setPendingExpense] = useState<ExpenseCreate | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<ExpenseResponse[]>([]);

  const { data: members, isLoading: isLoadingMembers } = useGroupMembers(groupId);
  const {
    data: monthlyData,
    isLoading: isLoadingExpenses,
    error: expensesError,
    refetch: refreshMonthlyData,
  } = useMonthlyBalance(groupId, year, month);

  const submitExpense = async (expenseData: ExpenseCreate) => {
    try {
      setCreateExpenseError(null);
      const { data: result, error } = await createExpense(groupId, expenseData);
      if (error) {
        throw new Error(error);
      } else if (result) {
        setShowForm(false);
        setShowTransferForm(false);
        setPendingExpense(null);
        setDuplicateMatches([]);
        refreshMonthlyData();
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      setCreateExpenseError(error instanceof Error ? error.message : 'Failed to create expense');
    }
  };

  const handleCreateExpense = async (expenseData: ExpenseCreate) => {
    const [expYear, expMonth] = expenseData.date.split('-').map(Number);
    const { data: similar } = await checkSimilarExpenses(
      groupId, expYear, expMonth, expenseData.amount, expenseData.description, expenseData.date,
    );
    if (similar && similar.length > 0) {
      setPendingExpense(expenseData);
      setDuplicateMatches(similar);
      return;
    }
    await submitExpense(expenseData);
  };

  const handleDuplicateConfirm = async () => {
    if (pendingExpense) await submitExpense(pendingExpense);
  };

  const handleDuplicateCancel = () => {
    setPendingExpense(null);
    setDuplicateMatches([]);
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
          onAddExpense={handleAddExpense}
          onAddTransfer={handleAddTransfer}
          showForm={showForm}
          showTransferForm={showTransferForm}
          monthlyData={monthlyData}
          groupId={groupId}
          year={year}
          month={month}
        />

        <MonthPicker year={year} month={month} onNavigate={handleMonthChange} />

        {isLoadingExpenses ? (
          <LoadingState message="Loading expenses..." />
        ) : (
          <ExpenseContent
            groupId={groupId}
            isLoading={isLoadingExpenses}
            monthlyData={monthlyData}
            members={members || []}
            onExpenseUpdated={refreshMonthlyData}
          />
        )}

        {showForm && members && (
          <FormModal
            isOpen={showForm}
            onClose={() => { setShowForm(false); setCreateExpenseError(null); }}
            title="Add Expense"
            error={createExpenseError}
          >
            <ExpenseForm
              onSubmit={handleCreateExpense}
              members={members}
              onCancel={() => { setShowForm(false); setCreateExpenseError(null); }}
            />
          </FormModal>
        )}

        {showTransferForm && members && (
          <FormModal
            isOpen={showTransferForm}
            onClose={() => { setShowTransferForm(false); setCreateExpenseError(null); }}
            title="Add Money Transfer"
            error={createExpenseError}
          >
            <MoneyTransferForm
              onSubmit={handleCreateExpense}
              members={members}
              onCancel={() => { setShowTransferForm(false); setCreateExpenseError(null); }}
            />
          </FormModal>
        )}

        {duplicateMatches.length > 0 && pendingExpense && (
          <ConfirmationModal
            isOpen={true}
            title="Gasto similar encontrado"
            message={[
              'Ya existe un gasto similar en este mes:',
              '',
              `📋 ${duplicateMatches[0].description}`,
              `💰 $${duplicateMatches[0].amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
              `📅 ${new Date(duplicateMatches[0].date + 'T00:00:00').toLocaleDateString('es-AR')}`,
              `🏷️ ${duplicateMatches[0].category}`,
              `💳 ${duplicateMatches[0].paymentType === 'debit' ? 'Débito' : 'Crédito'}`,
              `👤 ${members?.find(m => m.id === duplicateMatches[0].payerId)?.name ?? '—'}`,
              '',
              '¿Querés crearlo de todas formas?',
            ].join('\n')}
            confirmText="Sí, crear de todas formas"
            cancelText="Cancelar"
            onConfirm={handleDuplicateConfirm}
            onCancel={handleDuplicateCancel}
          />
        )}
      </div>
    </div>
  );
}
