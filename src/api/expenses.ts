import { config } from '../config/env';
import type { ExpenseCreate, ExpenseResponse, MonthlyBalanceResponse } from '../types/expense';

export async function createExpense(expense: ExpenseCreate): Promise<{ data: ExpenseResponse | null; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { data: null, error: 'No authentication token found' };
    }

    const response = await fetch(`${config.apiBaseUrl}/api/v1/expenses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
      headers: {
        'Content-Type': 'application/json',
      },
      // Add query parameter to indicate we want to delete all installments
      // The backend should handle this parameter
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

export async function settleMonthlyBalance(year: number, month: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/shares/settle/${year}/${month}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const result = await response.json();
      return { success: false, error: result.detail || 'Failed to settle balance' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error settling balance:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function recalculateMonthlyBalance(year: number, month: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    console.log('Recalculating with token:', token?.substring(0, 10) + '...');
    console.log(`Calling API: ${config.apiBaseUrl}/api/v1/shares/recalculate/${year}/${month}`);

    const response = await fetch(`${config.apiBaseUrl}/api/v1/shares/recalculate/${year}/${month}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('API Response:', response.status, response.statusText);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      let errorDetail;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.detail || 'Failed to recalculate balance';
      } catch {
        errorDetail = responseText || 'Failed to recalculate balance';
      }
      return { success: false, error: errorDetail };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error recalculating balance:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}