import { config } from '../config/env';
import type { ShortcutTokenIssued, ShortcutTokenStatus } from '../types/expense';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const url = () => `${config.apiBaseUrl}/api/v1/members/me/shortcut-token`;

export async function getShortcutToken(): Promise<ShortcutTokenStatus> {
  const response = await fetch(url(), { headers: authHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el estado del atajo');
  return (await response.json()).data as ShortcutTokenStatus;
}

export async function issueShortcutToken(): Promise<ShortcutTokenIssued> {
  const response = await fetch(url(), { method: 'POST', headers: authHeaders() });
  if (!response.ok) throw new Error('No se pudo generar el token del atajo');
  return (await response.json()).data as ShortcutTokenIssued;
}

export async function revokeShortcutToken(): Promise<void> {
  const response = await fetch(url(), { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw new Error('No se pudo revocar el token del atajo');
}
