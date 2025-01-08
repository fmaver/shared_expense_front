import { useState, useEffect } from 'react';
import { getMonthlyExpenses } from '../api/expenses';
import type { MonthlyBalanceResponse } from '../types/expense';

export function useExpenses(year: number, month: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyBalanceResponse | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getMonthlyExpenses(year, month);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [year, month]);

  return { data, isLoading, error };
}