import { config } from '../config/env';
import type { Draft } from '../types/expense';

/** Todas las llamadas fetch de este repo mandan el bearer a mano; axios no interviene acá. */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const base = () => `${config.apiBaseUrl}/api/v1/drafts`;

async function failure(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === 'string') return new Error(detail);
  } catch {
    /* cuerpo vacío o no JSON */
  }
  return new Error(fallback);
}

export async function getDrafts(): Promise<Draft[]> {
  const response = await fetch(`${base()}`, { headers: authHeaders() });
  if (!response.ok) throw await failure(response, 'No se pudieron cargar los borradores');
  return (await response.json()).data as Draft[];
}

/** La imagen llega cruda (sin envelope); la devolvemos como File para reusar el flujo de adjuntos. */
export async function getDraftImage(id: number): Promise<File> {
  const response = await fetch(`${base()}/${id}/image`, { headers: authHeaders() });
  if (!response.ok) throw await failure(response, 'No se pudo cargar la imagen');
  const blob = await response.blob();
  return new File([blob], `captura-${id}.jpg`, { type: blob.type });
}

export async function confirmDraft(id: number, groupId: number): Promise<void> {
  const response = await fetch(`${base()}/${id}/confirm`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId }),
  });
  if (!response.ok) throw await failure(response, 'No se pudo confirmar el borrador');
}

export async function saveDraft(file: File): Promise<Draft> {
  const form = new FormData();
  form.append('file', file);
  // Sin Content-Type: el navegador arma el boundary del multipart.
  const response = await fetch(`${base()}`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) throw await failure(response, 'No se pudo guardar el borrador');
  return (await response.json()).data as Draft;
}

export async function resolveDraft(id: number): Promise<void> {
  const response = await fetch(`${base()}/${id}/resolve`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) throw await failure(response, 'No se pudo marcar el borrador como resuelto');
}

export async function discardDraft(id: number): Promise<void> {
  const response = await fetch(`${base()}/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw await failure(response, 'No se pudo descartar el borrador');
}
