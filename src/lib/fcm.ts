import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { ref, set } from 'firebase/database';
import { app, rtdb } from './firebase';
import { soundAlerts } from './soundAlerts';

export const FCM_VAPID_KEY = 'BFCOcI0TqDVacrJtsyQLlY1HO6AD-a9L6vosS-vN4kS_TEBhiWBul3DixZGYSxJHSo72D0VY5Prr8sqHYFFXbJk';

let messagingInstance: Messaging | null = null;

export const getFirebaseMessaging = (): Messaging | null => {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }
  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (err) {
      console.warn('Firebase Messaging not supported in this environment:', err);
    }
  }
  return messagingInstance;
};

/**
 * Registers Web Push Service Worker and retrieves the FCM Registration Token
 * Stores the token in Firebase Realtime Database at system/adminFcmTokens
 */
export const registerAdminPushNotifications = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission was not granted by user:', permission);
      return null;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    // Register service worker if not already registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('Service worker registration warning:', swErr);
      }
    }

    const currentToken = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (currentToken) {
      console.log('✓ FCM Token obtained successfully:', currentToken.substring(0, 15) + '...');

      // Save token to RTDB for cloud push triggers
      if (rtdb) {
        const cleanKey = currentToken.replace(/[.#$[\]]/g, '_');
        await set(ref(rtdb, `system/adminFcmTokens/${cleanKey}`), {
          token: currentToken,
          updatedAt: new Date().toISOString(),
          platform: 'web_admin',
          userAgent: navigator.userAgent,
        }).catch(() => {});
      }

      // Listen for incoming foreground messages
      onMessage(messaging, (payload) => {
        console.log('⚡ Foreground Push Message received:', payload);
        const title = payload.notification?.title || payload.data?.title || '🚨 NEW ORDER RECEIVED!';
        const body = payload.notification?.body || payload.data?.body || 'A new order has arrived!';
        const orderId = payload.data?.orderId || 'new';

        // Immediately start loud continuous siren alarm!
        soundAlerts.startContinuousOrderAlarm({
          id: orderId,
          customerName: payload.data?.customerName || 'Online Customer',
          amount: Number(payload.data?.amount) || 0,
        });

        // Show native notification if allowed
        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: 'https://i.imgur.com/x7VzA1Q.jpeg',
              badge: 'https://i.imgur.com/x7VzA1Q.jpeg',
              requireInteraction: true,
            });
          } catch {}
        }
      });

      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.warn('Error retrieving FCM registration token:', err);
    return null;
  }
};
