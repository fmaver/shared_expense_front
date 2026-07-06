import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Month context backed by `?year=&month=` URL search params (the app's
 * existing deep-link convention). Invalid or missing params fall back to
 * the current month.
 */
export function useMonthSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();
  const y = parseInt(searchParams.get('year') ?? '', 10);
  const m = parseInt(searchParams.get('month') ?? '', 10);
  const year = Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : today.getFullYear();
  const month = Number.isFinite(m) && m >= 1 && m <= 12 ? m : today.getMonth() + 1;

  const setYearMonth = useCallback((newYear: number, newMonth: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('year', String(newYear));
      next.set('month', String(newMonth));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return { year, month, setYearMonth };
}
