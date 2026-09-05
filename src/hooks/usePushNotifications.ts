import { useCallback, useEffect, useState } from 'react';
import { deletePushSubscription, getPushPublicKey, savePushSubscription } from '@/api/push';

/**
 * Why a web app can't receive push right now, when it can't.
 *
 * `needs-install` is the one that matters on iPhone: Safari on iOS does not deliver web push
 * at all — only a web app added to the Home Screen does. No amount of code changes that, so
 * the UI has to explain it rather than show a button that cannot work.
 */
export type PushStatus =
  | 'unsupported'
  | 'needs-install'
  | 'not-configured'
  | 'denied'
  | 'subscribed'
  | 'available';

/** True when running as an installed web app rather than a browser tab. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS predates display-mode and exposes its own flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** VAPID keys travel base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalised);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function toPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
  };
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('unsupported');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        // On iOS this is what a plain Safari tab looks like — the APIs simply are not there.
        if (!cancelled) setStatus(isIOS() && !isStandalone() ? 'needs-install' : 'unsupported');
        return;
      }
      if (isIOS() && !isStandalone()) {
        if (!cancelled) setStatus('needs-install');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setStatus('denied');
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      if (!cancelled) setStatus(existing ? 'subscribed' : 'available');
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setIsBusy(true);
    try {
      const publicKey = await getPushPublicKey();
      if (!publicKey) {
        setStatus('not-configured');
        return;
      }

      // Must follow a user gesture: iOS effectively gives one chance, and a denial can only be
      // undone in Settings.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'available');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await savePushSubscription(toPayload(subscription));
      setStatus('subscribed');
    } finally {
      setIsBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(toPayload(subscription));
        await subscription.unsubscribe();
      }
      setStatus('available');
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { status, isBusy, subscribe, unsubscribe };
}
