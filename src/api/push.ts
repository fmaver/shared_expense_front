import { config } from '../config/env';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * The server's VAPID public key. Returns null when push is not configured on this deployment,
 * which is a normal state rather than an error — email keeps working.
 */
export async function getPushPublicKey(): Promise<string | null> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/push/public-key`, {
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  const result = await response.json();
  return (result.data?.publicKey as string) ?? null;
}

export async function savePushSubscription(payload: PushSubscriptionPayload): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/push/subscribe`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to register for notifications');
}

export async function deletePushSubscription(payload: PushSubscriptionPayload): Promise<void> {
  await fetch(`${config.apiBaseUrl}/api/v1/push/subscribe`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}
