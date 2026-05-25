import { config } from '../config/env';
import type { GroupJoinLink, GroupJoinResolveResponse } from '../types/expense';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok) {
    const detail = result.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return result.data as T;
}

export async function getJoinLink(groupId: number): Promise<GroupJoinLink> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/join-link`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<GroupJoinLink>(response);
}

export async function rotateJoinLink(groupId: number): Promise<GroupJoinLink> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/join-link/rotate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<GroupJoinLink>(response);
}

export async function resolveJoinToken(token: string): Promise<GroupJoinResolveResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/join/resolve/${token}`);
  return handleResponse<GroupJoinResolveResponse>(response);
}

export async function registerAndJoin(
  token: string,
  data: { name: string; email: string; password: string },
): Promise<{ accessToken: string; tokenType: string }> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/join/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<{ accessToken: string; tokenType: string }>(response);
}
