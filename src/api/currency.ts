import { config } from '../config/env';

export interface CurrencyRate {
  rate: number | null;
  currency: string;
  source: string;
}

export async function getBlueRate(): Promise<CurrencyRate> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${config.apiBaseUrl}/api/v1/currency/rate`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch currency rate');
  const json = await res.json();
  return json.data as CurrencyRate;
}
