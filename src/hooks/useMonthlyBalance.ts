import { useState, useEffect, useCallback, useRef } from 'react';
import { getAggregateBalance, getMonthlyBalance } from '../api/shares';
import { useExpenseRefresh } from '../contexts/ExpenseRefreshContext';
import type { MonthlyBalanceResponse } from '../types/expense';

/**
 * Balance for a group.
 *
 * A one-time (occasion) group has no months, so it reads the aggregate endpoint instead and
 * the result is shaped into the same response the month view expects — the consumers below
 * care about expenses/balances/transfers/isSettled, not about which month they came from.
 */
export function useMonthlyBalance(
  groupId: number,
  year: number,
  month: number,
  isOneTime = false,
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyBalanceResponse | null>(null);

  const fetchMonthlyBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (isOneTime) {
        const aggregate = await getAggregateBalance(groupId);
        setData(
          aggregate && {
            year,
            month,
            expenses: aggregate.expenses,
            balances: aggregate.balances,
            isSettled: aggregate.isSettled,
            transfers: aggregate.transfers,
          },
        );
      } else {
        setData(await getMonthlyBalance(groupId, year, month));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly balance');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, year, month, isOneTime]);

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