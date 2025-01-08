import { config } from '../config/env';
import type { ExpenseCreate, ExpenseResponse, MonthlyBalanceResponse } from '../types/expense';

export async function createExpense(expense: ExpenseCreate): Promise<{ data: ExpenseResponse | null; error: string | null }> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/expenses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.detail || 'Failed to create expense' };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error creating expense:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function getMonthlyExpenses(year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/expenses/${year}/${month}`);
    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return null;
  }
}

export async function updateExpense(expenseId: number, expense: ExpenseCreate): Promise<{ data: ExpenseResponse | null; error: string | null }> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.detail || 'Failed to update expense' };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating expense:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function deleteExpense(expenseId: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/expenses/${expenseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      return { success: false, error: result.detail || 'Failed to delete expense' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}