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

export async function recalculateMonthlyShare(year: number, month: number): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log(`Recalculating monthly share for ${year}/${month}`);
    const response = await fetch(`${config.apiBaseUrl}/api/v1/shares/recalculate/${year}/${month}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Error response text:', text);
      let errorMessage = 'Failed to recalculate monthly share';
      try {
        const error = JSON.parse(text);
        errorMessage = error.detail || errorMessage;
      } catch {
        // If JSON parsing fails, use the raw text if available
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }
    
    console.log('Recalculation successful');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error recalculating monthly share:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to recalculate monthly share'
    };
  }
}