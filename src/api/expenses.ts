import { config } from '../config/env';
import type { ExpenseCreate, ExpenseResponse, MonthlyBalanceResponse } from '../types/expense';

export async function createExpense(groupId: number, expense: ExpenseCreate): Promise<{ data: ExpenseResponse | null; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { data: null, error: 'No authentication token found' };
    }
    const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(expense),
    });
    const result = await response.json();
    if (!response.ok) {
      const detail = result.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      if (response.status === 409) {
        return { data: null, error: `${msg} Podés reabrir el mes desde el panel de balance.` };
      }
      return { data: null, error: msg || 'Failed to create expense' };
    }
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error creating expense:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function checkSimilarExpenses(
  groupId: number,
  year: number,
  month: number,
  amount: number,
  description: string,
  expenseDate: string,
): Promise<{ data: ExpenseResponse[] | null; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { data: null, error: 'No authentication token found' };
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
      amount: amount.toString(),
      description,
      date: expenseDate,
    });
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/similar?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return { data: null, error: null };
    const result = await response.json();
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: null };
  }
}

export async function getMonthlyExpenses(groupId: number, year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const token = localStorage.getItem('token');
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/${year}/${paddedMonth}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
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

export async function updateExpense(groupId: number, expenseId: number, expense: ExpenseCreate): Promise<{ data: ExpenseResponse | null; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/${expenseId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(expense),
      }
    );
    const result = await response.json();
    if (!response.ok) {
      const detail = result.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { data: null, error: msg || 'Failed to update expense' };
    }
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating expense:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function deleteExpense(groupId: number, expenseId: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/${expenseId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }
    );
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

export async function settleMonthlyBalance(groupId: number, year: number, month: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/settle/${year}/${paddedMonth}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }
    );
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

export async function recalculateMonthlyBalance(groupId: number, year: number, month: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/recalculate/${year}/${month}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }
    );
    const responseText = await response.text();
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
