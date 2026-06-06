import { config } from '../config/env';
import type {
  RecurringGroupExpenseCreate,
  RecurringGroupExpenseUpdate,
  RecurringGroupExpenseResponse,
} from '../types/expense';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createRecurringGroupExpense(
  groupId: number,
  data: RecurringGroupExpenseCreate,
): Promise<{ data?: RecurringGroupExpenseResponse; error?: string }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { error: 'No authentication token found' };
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/recurring/`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      const detail = result.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { error: msg || 'Failed to create recurring expense' };
    }
    return { data: result.data };
  } catch (error) {
    console.error('Error creating recurring group expense:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function listRecurringGroupExpenses(
  groupId: number,
): Promise<{ data?: RecurringGroupExpenseResponse[]; error?: string }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { error: 'No authentication token found' };
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/recurring/`,
      { headers: authHeaders() },
    );
    const result = await response.json();
    if (!response.ok) {
      const detail = result.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { error: msg || 'Failed to list recurring expenses' };
    }
    return { data: result.data };
  } catch (error) {
    console.error('Error listing recurring group expenses:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateRecurringGroupExpense(
  groupId: number,
  id: number,
  data: RecurringGroupExpenseUpdate,
  viewedYear: number,
  viewedMonth: number,
): Promise<{ data?: RecurringGroupExpenseResponse; error?: string }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { error: 'No authentication token found' };
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/recurring/${id}?viewed_year=${viewedYear}&viewed_month=${viewedMonth}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      const detail = result.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { error: msg || 'Failed to update recurring expense' };
    }
    return { data: result.data };
  } catch (error) {
    console.error('Error updating recurring group expense:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteRecurringGroupExpense(
  groupId: number,
  id: number,
  viewedYear: number,
  viewedMonth: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'No authentication token found' };
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/expenses/recurring/${id}?viewed_year=${viewedYear}&viewed_month=${viewedMonth}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      },
    );
    if (!response.ok) {
      const result = await response.json();
      const detail = result.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { success: false, error: msg || 'Failed to delete recurring expense' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting recurring group expense:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
