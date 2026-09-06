import { config } from '../config/env';
import type { DueDate, DueDateInput } from '../types/expense';

/** Todas las llamadas fetch de este repo mandan el bearer a mano; axios no interviene acá. */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function base(groupId: number): string {
  return `${config.apiBaseUrl}/api/v1/groups/${groupId}/due-dates`;
}

export async function getDueDates(groupId: number): Promise<DueDate[]> {
  const response = await fetch(`${base(groupId)}/`, { headers: authHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar los vencimientos');
  return (await response.json()).data as DueDate[];
}

export async function createDueDate(groupId: number, input: DueDateInput): Promise<DueDate> {
  const response = await fetch(`${base(groupId)}/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('No se pudo crear el vencimiento');
  return (await response.json()).data as DueDate;
}

export async function updateDueDate(
  groupId: number,
  id: number,
  input: Partial<DueDateInput> & { active?: boolean },
): Promise<DueDate> {
  const response = await fetch(`${base(groupId)}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el vencimiento');
  return (await response.json()).data as DueDate;
}

export async function deleteDueDate(groupId: number, id: number): Promise<void> {
  const response = await fetch(`${base(groupId)}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('No se pudo borrar el vencimiento');
}
