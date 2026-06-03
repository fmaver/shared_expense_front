import { config } from '../config/env';
import type {
  Group,
  PersonalLedgerResponse,
  RecurringIncomeResponse,
  IncomeInstanceResponse,
  RecurringIncomeCreate,
  RecurringIncomeUpdate,
  VariableIncomeCreate,
  VariableIncomeUpdate,
  RecurringPersonalExpenseCreate,
  RecurringPersonalExpenseUpdate,
  RecurringPersonalExpenseResponse,
} from '../types/expense';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok) {
    const detail = result.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return result.data as T;
}

// Personal group

export async function getPersonalGroup(): Promise<Group> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/group`, {
    headers: authHeaders(),
  });
  return handleResponse<Group>(response);
}

// Ledger

export async function getPersonalLedger(year: number, month: number): Promise<PersonalLedgerResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/ledger/${year}/${month}`, {
    headers: authHeaders(),
  });
  return handleResponse<PersonalLedgerResponse>(response);
}

// Recurring income

export async function listRecurringIncomes(): Promise<RecurringIncomeResponse[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/recurring`, {
    headers: authHeaders(),
  });
  return handleResponse<RecurringIncomeResponse[]>(response);
}

export async function createRecurringIncome(data: RecurringIncomeCreate): Promise<RecurringIncomeResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/recurring`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (response.status === 201) {
    const result = await response.json();
    return result.data as RecurringIncomeResponse;
  }
  return handleResponse<RecurringIncomeResponse>(response);
}

export async function updateRecurringIncome(
  id: number,
  data: RecurringIncomeUpdate,
  viewedYear?: number,
  viewedMonth?: number,
): Promise<RecurringIncomeResponse> {
  const params = viewedYear && viewedMonth
    ? `?viewed_year=${viewedYear}&viewed_month=${viewedMonth}`
    : '';
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/recurring/${id}${params}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<RecurringIncomeResponse>(response);
}

export async function deleteRecurringIncome(id: number, year?: number, month?: number): Promise<RecurringIncomeResponse> {
  const params = year && month ? `?viewed_year=${year}&viewed_month=${month}` : '';
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/recurring/${id}${params}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<RecurringIncomeResponse>(response);
}

// Variable income

export async function listVariableIncomes(year: number, month: number): Promise<IncomeInstanceResponse[]> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/v1/personal/income/variable/${year}/${month}`,
    { headers: authHeaders() }
  );
  return handleResponse<IncomeInstanceResponse[]>(response);
}

export async function createVariableIncome(data: VariableIncomeCreate): Promise<IncomeInstanceResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/variable`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<IncomeInstanceResponse>(response);
}

export async function updateVariableIncome(id: number, data: VariableIncomeUpdate): Promise<IncomeInstanceResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/variable/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<IncomeInstanceResponse>(response);
}

export async function deleteVariableIncome(id: number): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/income/variable/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to delete variable income');
  }
}

// Recurring personal expenses

export async function listRecurringPersonalExpenses(): Promise<RecurringPersonalExpenseResponse[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/expenses/recurring`, {
    headers: authHeaders(),
  });
  return handleResponse<RecurringPersonalExpenseResponse[]>(response);
}

export async function createRecurringPersonalExpense(data: RecurringPersonalExpenseCreate): Promise<RecurringPersonalExpenseResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/expenses/recurring`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (response.status === 201) {
    const result = await response.json();
    return result.data as RecurringPersonalExpenseResponse;
  }
  return handleResponse<RecurringPersonalExpenseResponse>(response);
}

export async function updateRecurringPersonalExpense(
  id: number,
  data: RecurringPersonalExpenseUpdate,
  viewedYear?: number,
  viewedMonth?: number,
): Promise<RecurringPersonalExpenseResponse> {
  const params = viewedYear && viewedMonth
    ? `?viewed_year=${viewedYear}&viewed_month=${viewedMonth}`
    : '';
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/expenses/recurring/${id}${params}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<RecurringPersonalExpenseResponse>(response);
}

export async function deleteRecurringPersonalExpense(id: number, year?: number, month?: number): Promise<RecurringPersonalExpenseResponse> {
  const params = year && month ? `?viewed_year=${year}&viewed_month=${month}` : '';
  const response = await fetch(`${config.apiBaseUrl}/api/v1/personal/expenses/recurring/${id}${params}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<RecurringPersonalExpenseResponse>(response);
}
