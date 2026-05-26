import { config } from '../config/env';
import type { MonthlyBalanceResponse } from '../types/expense';

export async function downloadMonthlyPdf(groupId: number, year: number, month: number): Promise<void> {
  const token = localStorage.getItem('token');
  const paddedMonth = month.toString().padStart(2, '0');
  const response = await fetch(
    `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/${year}/${paddedMonth}/pdf`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `balance_${year}_${paddedMonth}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function getMonthlyBalance(groupId: number, year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const token = localStorage.getItem('token');
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/${year}/${paddedMonth}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch monthly balance');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching monthly balance:', error);
    return null;
  }
}

export async function settleMonthlyShare(groupId: number, year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const token = localStorage.getItem('token');
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/settle/${year}/${paddedMonth}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error('Failed to settle monthly share');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error settling monthly share:', error);
    return null;
  }
}

export async function unsettleMonthlyShare(groupId: number, year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const token = localStorage.getItem('token');
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/unsettle/${year}/${paddedMonth}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error('Failed to unsettle monthly share');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error unsettling monthly share:', error);
    return null;
  }
}

export async function recalculateMonthlyShare(groupId: number, year: number, month: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/groups/${groupId}/shares/recalculate/${year}/${month}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = 'Failed to recalculate monthly share';
      try {
        const err = JSON.parse(text);
        errorMessage = err.detail || errorMessage;
      } catch {
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Error recalculating monthly share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recalculate monthly share',
    };
  }
}
