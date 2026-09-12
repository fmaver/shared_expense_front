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
  /**
   * Whether the group type is known yet. `isOneTime` is derived from an async fetch, so
   * before it resolves it reads false — indistinguishable from a genuine ongoing group.
   * Fetching then would hit the monthly endpoint for a group that has no months.
   */
  enabled = true,
) {
  // What was asked for. A response is only ever shown under the exact group and month it was
  // fetched for: switching group or month leaves the previous request in flight, and if it
  // lands second it would otherwise paint another group's expenses and balances over this one.
  const key = `${groupId}:${year}:${month}:${isOneTime}`;
  const [result, setResult] = useState<{ key: string; value: MonthlyBalanceResponse | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Requests are numbered so a slow one that resolves after a newer one can be dropped.
  const latestRequest = useRef(0);

  const fetchMonthlyBalance = useCallback(async () => {
    if (!enabled) return;
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    setError(null);
    try {
      let value: MonthlyBalanceResponse | null;
      if (isOneTime) {
        const aggregate = await getAggregateBalance(groupId);
        value = aggregate && {
          year,
          month,
          expenses: aggregate.expenses,
          balances: aggregate.balances,
          isSettled: aggregate.isSettled,
          transfers: aggregate.transfers,
        };
      } else {
        value = await getMonthlyBalance(groupId, year, month);
      }
      if (requestId !== latestRequest.current) return;
      setResult({ key, value });
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly balance');
      setResult({ key, value: null });
    }
  }, [groupId, year, month, isOneTime, enabled, key]);

  useEffect(() => {
    fetchMonthlyBalance();
  }, [fetchMonthlyBalance]);

  // Refetch when an expense is created from outside this subtree (e.g. the
  // mobile FAB launcher). Skip the initial render so we don't double-fetch on
  // mount; use a ref so we always call the latest (group/year/month-bound) fetch.
  const { refreshSignal } = useExpenseRefresh();
  const fetchRef = useRef(fetchMonthlyBalance);
  fetchRef.current = fetchMonthlyBalance;

  // Track the last signal value actually seen rather than "have I mounted yet". A boolean is
  // mount-scoped, so if this view remounts between the signal being sent and the effect
  // running, the real refresh is swallowed as though it were the initial one and the new
  // expense never appears until you navigate away and back. Seeding the ref with the current
  // value keeps the mount case fetch-free, without discarding a genuine bump.
  const lastSeenSignal = useRef(refreshSignal);
  useEffect(() => {
    if (lastSeenSignal.current === refreshSignal) return;
    lastSeenSignal.current = refreshSignal;
    fetchRef.current();
  }, [refreshSignal]);

  const fresh = result && result.key === key ? result : null;
  return {
    data: fresh ? fresh.value : null,
    isLoading: fresh === null,
    error,
    refetch: fetchMonthlyBalance,
  };
}
