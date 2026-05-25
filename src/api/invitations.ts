import { config } from '../config/env';
import type { Invitation, InvitationResolveResponse } from '../types/expense';

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

export async function createInvitation(
  groupId: number,
  data: { name: string; channel: 'email' | 'phone'; contact: string },
): Promise<Invitation> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/invitations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Invitation>(response);
}

export async function listInvitations(groupId: number): Promise<Invitation[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/invitations`, {
    headers: authHeaders(),
  });
  return handleResponse<Invitation[]>(response);
}

export async function revokeInvitation(groupId: number, token: string): Promise<void> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/v1/groups/${groupId}/invitations/${token}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to revoke invitation');
  }
}

export async function resolveInvitation(token: string): Promise<InvitationResolveResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/invitations/resolve/${token}`);
  return handleResponse<InvitationResolveResponse>(response);
}

export async function acceptInvitation(
  token: string,
  body: { email?: string; password?: string },
): Promise<{ accessToken: string; tokenType: string }> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const existing = localStorage.getItem('token');
  if (existing) headers['Authorization'] = `Bearer ${existing}`;

  const response = await fetch(`${config.apiBaseUrl}/api/v1/invitations/${token}/accept`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse<{ accessToken: string; tokenType: string }>(response);
}
