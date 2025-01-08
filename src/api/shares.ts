import { config } from '../config/env';
import type { MonthlyBalanceResponse } from '../types/expense';

export async function getMonthlyBalance(year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(`${config.apiBaseUrl}/api/v1/shares/${year}/${paddedMonth}`);
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

export async function settleMonthlyShare(year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(`${config.apiBaseUrl}/api/v1/shares/settle/${year}/${paddedMonth}`, {
      method: 'POST',
    });
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

export async function recalculateMonthlyShare(year: number, month: number): Promise<MonthlyBalanceResponse | null> {
  try {
    const paddedMonth = month.toString().padStart(2, '0');
    const response = await fetch(`${config.apiBaseUrl}/api/v1/shares/recalculate/${year}/${paddedMonth}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to recalculate monthly share');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error recalculating monthly share:', error);
    return null;
  }
}