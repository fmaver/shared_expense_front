import { useState, useEffect, useCallback, useRef } from 'react';
import { getMonthlyBalance } from '../api/shares';
import { useExpenseRefresh } from '../contexts/ExpenseRefreshContext';
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

  // Refetch when an expense is created from outside this subtree (e.g. the
  // mobile FAB launcher). Skip the initial render so we don't double-fetch on
  // mount; use a ref so we always call the latest (group/year/month-bound) fetch.
  const { refreshSignal } = useExpenseRefresh();
  const fetchRef = useRef(fetchMonthlyBalance);
  fetchRef.current = fetchMonthlyBalance;
  const isFirstSignal = useRef(true);
  useEffect(() => {
    if (isFirstSignal.current) {
      isFirstSignal.current = false;
      return;
    }
    fetchRef.current();
  }, [refreshSignal]);

  return { data, isLoading, error, refetch: fetchMonthlyBalance };
}