import { config } from '../config/env';
import type { ExpenseSearchResponse } from '../types/expense';

export async function searchExpenses(q: string, groupId?: number, signal?: AbortSignal): Promise<ExpenseSearchResponse> {
  const params = new URLSearchParams({ q });
  if (groupId !== undefined) params.set('groupId', String(groupId));
  const token = localStorage.getItem('token');
  const res = await fetch(`${config.apiBaseUrl}/api/v1/search/expenses?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json.detail === 'string' ? json.detail : 'Search failed');
  return json.data as ExpenseSearchResponse;
}
