import { useEffect, useRef, useState } from 'react';
import { getPersonalLedger } from '@/api/personal';
import type { PersonalLedgerResponse } from '@/types/expense';

export interface TrendPoint {
  label: string;
  income: number;
  personal: number;
  groups: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Serie de los últimos N meses del ledger personal, más el mes anterior para comparar.
 *
 * Vive en un hook porque lo consumen dos pantallas (el home personal y Números) y son
 * bastantes decisiones como para tenerlas duplicadas: los meses pasados se cachean —
 * no cambian —, sólo el mes que estás viendo se vuelve a pedir cuando algo se guarda, y
 * los pedidos salen de a uno porque un `Promise.all` de doce ahoga el pool del backend.
 */
export function usePersonalTrend(year: number, month: number, range: 3 | 6 | 12, refreshKey: unknown) {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [prevLedger, setPrevLedger] = useState<PersonalLedgerResponse | null>(null);
  const cacheRef = useRef(new Map<string, Omit<TrendPoint, 'label'>>());

  useEffect(() => {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthNum = month === 1 ? 12 : month - 1;
    let cancelled = false;
    getPersonalLedger(prevYear, prevMonthNum)
      .then(l => { if (!cancelled) setPrevLedger(l); })
      .catch(() => { if (!cancelled) setPrevLedger(null); });
    return () => { cancelled = true; };
  }, [year, month]);

  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);

    const points: { year: number; month: number }[] = [];
    let y = year;
    let m = month;
    for (let i = 0; i < range; i++) {
      points.unshift({ year: y, month: m });
      if (--m === 0) { m = 12; y--; }
    }

    (async () => {
      const cache = cacheRef.current;
      const results: Omit<TrendPoint, 'label'>[] = [];
      for (const p of points) {
        const key = `${p.year}-${p.month}`;
        const isViewedMonth = p.year === year && p.month === month;
        const cached = cache.get(key);
        if (cached && !isViewedMonth) {
          results.push(cached);
          continue;
        }
        const r = await getPersonalLedger(p.year, p.month);
        const point = {
          income: r.totalIncome,
          personal: r.totalPersonalExpenses,
          groups: r.mirroredShares.reduce((s, sh) => s + sh.shareAmount, 0),
        };
        cache.set(key, point);
        results.push(point);
      }
      if (cancelled) return;
      setTrendData(results.map((r, i) => ({
        label: points[i].year !== year
          ? `${MONTHS[points[i].month - 1]} '${String(points[i].year).slice(2)}`
          : MONTHS[points[i].month - 1],
        ...r,
      })));
    })()
      .catch(() => { /* sin serie, el gráfico muestra su vacío */ })
      .finally(() => { if (!cancelled) setTrendLoading(false); });

    return () => { cancelled = true; };
  }, [year, month, range, refreshKey]);

  return { trendData, trendLoading, prevLedger };
}
