import { useState, useEffect, useCallback } from 'react';
import { getPersonalLedger } from '../api/personal';
import type { PersonalLedgerResponse } from '../types/expense';

export function usePersonalLedger(year: number, month: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PersonalLedgerResponse | null>(null);

  const fetchLedger = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getPersonalLedger(year, month);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch personal ledger');
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return { data, isLoading, error, refetch: fetchLedger };
}
