import { config } from '../config/env';
import type { Group, GroupMember } from '../types/expense';

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

export async function getMyGroups(): Promise<Group[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/`, {
    headers: authHeaders(),
  });
  return handleResponse<Group[]>(response);
}

export async function createGroup(name: string): Promise<Group> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<Group>(response);
}

export async function getGroup(groupId: number): Promise<Group> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}`, {
    headers: authHeaders(),
  });
  return handleResponse<Group>(response);
}

export async function updateGroupName(groupId: number, name: string): Promise<Group> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<Group>(response);
}

export async function closeGroup(groupId: number): Promise<Group> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/close`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<Group>(response);
}

export async function deleteGroup(groupId: number): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to delete group');
  }
}

export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/members`, {
    headers: authHeaders(),
  });
  return handleResponse<GroupMember[]>(response);
}

export async function inviteMember(groupId: number, email: string): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/members/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to invite member');
  }
}

export async function leaveGroup(groupId: number, memberId: number): Promise<void> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/v1/groups/${groupId}/members/${memberId}`,
    { method: 'DELETE', headers: authHeaders() }
  );
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to leave group');
  }
}
