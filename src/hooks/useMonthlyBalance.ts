import { useState, useEffect, useCallback } from 'react';
import { getMonthlyBalance } from '../api/shares';
import type { MonthlyBalanceResponse } from '../types/expense';

export function useMonthlyBalance(groupId: number, year: number, month: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyBalanceResponse | null>(null);

  const fetchMonthlyBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getMonthlyBalance(groupId, year, month);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly balance');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, year, month]);

  useEffect(() => {
    fetchMonthlyBalance();
  }, [fetchMonthlyBalance]);

  return { data, isLoading, error, refetch: fetchMonthlyBalance };
}