import { get, ref } from 'firebase/database';
import { rtdb } from './firebase';
import { Order } from '../types';

// Service Account credentials for SK Pizza Point FCM v1
const SERVICE_ACCOUNT = {
  client_email: 'firebase-adminsdk-fbsvc@sk-pizza-point.iam.gserviceaccount.com',
  project_id: 'sk-pizza-point',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDw2cauz38Ut/Zf
igkQ2m6B9RAhDr2rsL4njA+Ol6p6SbLHX/e/27fNUQ08CgW6KwfhZZBazRCFQAyM
4PtppEM/GMuPGwOAPXUI7Gps/CXp8aH8bR2QutFOXQyXX/zCqAA4xfTYO4uoYZuo
hUm5hIggo6uK3gpXAHhOEqNAx67PSxBdWqEOsX8vwJJxTlzQhqJHXeYn4qqxcGPB
HmufOeZEPiglUP0szNsSlVEFo/qTTuihjnHH5vg/Um4zw4dPal4opmDcHgUo/XGy
/m65A878Bj1N4VDnliVetMxKq3zMaA7+xgXWDJaRSBpOhuF3VEUiOFY7LB3dCmPb
vB01t4hlAgMBAAECggEAQRch3ll+ZyuGXnCQHalipyWDK+Pvd4iHA2oTRD6R2IW1
VrOFYajwJgFLGdg9jwAVG6GWnyt/VPunyKT+3SCC+fjp/m1XB1/UkspNwtFsL6rZ
U75reJM8gLid8AUFatf7Y1yAXLXO+v0SE7ud3pDGN0f0Us3KLpQWb0cTLq0ofaWt
7snVWFn/8CUa9BiQIGGq+iZelduhN8MBtrmYG5paicKI8Ejwr46a0usqT08ISjXU
IhSJdQZyOmW4cv8R/qDnfZOslFWIhiR4PQ6g7uD5ZW0gau+/TlNt7PsJ3eX9Zibb
J5scse6wBX/igavnErD5reY3nN35KNKqBQnB1YMF6wKBgQD+xJ14Wy5HFttjV22s
YSNnnsSQjAPunZmOQz3X3nidBPrz1kQa150x151B+I7ErLj3nz8/hbLjSVln8MHL
qHQgrC2sXcaBfqmE9Iuf+h/o8znslEty22FQmyOOWDrO1ifa5LDEHjfyOn+tghSe
HXFf+z6QsitM+9AAreSuYTMv5wKBgQDyA+6rOW/yqnliryDW7TYvhkXwdupkARqM
/rFsfHJO3F4zicGsekVJKYmp993olzIu2BRyrb3jh+KuVBG9prQCwMzEP4YM962K
ZF+vbIphteIQPshm4a38tz0brYL7KHeWHT6ctj4OB8POkFsKFV3xY6eSe5pqwGfl
0ydi7kLr0wKBgEwkcTfecIdYonsfTyz83zsB7ZeR8T7opVMqb5pL6FpteZ9Uw4gO
NvIFkf98jRbk1GdVle6jQ+LAMlNpVlJK52I4c3IXmNNtCrcs62oFtHHH9+DoNWB/
hqczpr3NSs40nTbDsLz8lxXzO+OchBL5k7/u9DUEuwJIJFN/pWAktsqzAoGAYTtH
Ni97VIk8/3LQxMjEzk8p5jRAczEmU6M38RgGbLyIdDhSQVNWZtBzaIAW/Y1RMhTK
ElDPS4yae+N2xTUmeTywh9/loWwYotM0xivbZOpICrLOnNbqqe+Mc4RAbVuSwBK7
xwZI5CYmeuTwTprLBWI+PtG99kma9HDjEBIdfNUCgYEA99Rq8y0D399Wre9vV6EF
IN0HmmVMjUAju879TXlmlp6U88YGIrEoxQ450HwIYrpDLqSPf6MeVQN0Y+0rzQaB
nTbz6b8C5DQyqOgEQpdb3+HBytoiffAUpHdQMB0+I/NwAljTNPzede96G9Xscqb3w
3JdY68ggFtRD9JAMnVhYt/o=
-----END PRIVATE KEY-----`,
};

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const byteStr = atob(b64);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }
  return bytes.buffer;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Creates Google OAuth 2.0 access token using Web Crypto API SubtleCrypto
 */
async function getGoogleOAuthAccessToken(): Promise<string | null> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60000) {
    return cachedAccessToken.token;
  }

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const keyData = pemToArrayBuffer(SERVICE_ACCOUNT.private_key);
    const cryptoKey = await window.crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedClaim = base64UrlEncode(JSON.stringify(claimSet));
    const unsignedToken = `${encodedHeader}.${encodedClaim}`;

    const encoder = new TextEncoder();
    const signatureBuffer = await window.crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    const signature = arrayBufferToBase64Url(signatureBuffer);
    const jwt = `${unsignedToken}.${signature}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!resp.ok) {
      console.warn('Google OAuth token request failed:', await resp.text());
      return null;
    }

    const data = await resp.json();
    if (data.access_token) {
      cachedAccessToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };
      return data.access_token;
    }
    return null;
  } catch (err) {
    console.warn('Error signing OAuth assertion:', err);
    return null;
  }
}

/**
 * Sends FCM v1 push notification to all registered Admin devices (Android APK & Web Admin)
 * Broadcasts to both topic 'admin_orders' and individual device tokens.
 */
export async function sendOrderPushNotification(order: Order): Promise<void> {
  try {
    // 1. Obtain Google OAuth 2.0 access token
    const accessToken = await getGoogleOAuthAccessToken();
    if (!accessToken) {
      console.warn('Could not generate FCM OAuth access token');
      return;
    }

    const itemsSummary = (order.items || [])
      .map((it) => `${it.quantity}x ${it.productName}`)
      .join(', ');

    const title = '🚨 NEW ORDER RECEIVED! — SK Pizza Point';
    const body = `Order #${order.id} from ${order.customerName} (₹${order.finalTotal}): ${itemsSummary}`;

    const dataPayload: Record<string, string> = {
      orderId: String(order.id),
      customerName: String(order.customerName || 'Customer'),
      customerPhone: String(order.customerPhone || ''),
      amount: String(order.finalTotal || '0'),
      orderType: String(order.orderType || 'delivery'),
      itemsSummary: String(itemsSummary),
      title: title,
      body: body,
      url: '/#/admin',
      channelId: 'sk_pizza_order_alerts_v3',
      type: 'new_order_urgent_alarm',
    };

    // Android high priority configuration (Data-only delivery wakes onMessageReceived even in Doze/Screen-off)
    const androidConfig = {
      priority: 'HIGH',
      ttl: '86400s',
    };

    const webpushConfig = {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title,
        body,
        icon: 'https://i.imgur.com/x7VzA1Q.jpeg',
        badge: 'https://i.imgur.com/x7VzA1Q.jpeg',
        requireInteraction: true,
      },
      data: dataPayload,
    };

    const sendPromises: Promise<any>[] = [];

    // A. Broadcast to topic 'admin_orders' (Pure high-priority DATA payload for Android APK so onMessageReceived triggers with WakeLock & Siren)
    const topicPayload = {
      message: {
        topic: 'admin_orders',
        data: dataPayload,
        android: androidConfig,
      },
    };

    sendPromises.push(
      fetch(
        `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(topicPayload),
        }
      )
        .then((r) => {
          if (r.ok) {
            console.log('✓ FCM push dispatched to topic admin_orders (Data-only urgent wakeup)');
          } else {
            r.text().then((t) => console.warn('FCM topic send warning:', t));
          }
        })
        .catch((err) => console.warn('FCM topic send error:', err))
    );

    // B. Also send direct push to registered individual tokens from Realtime Database
    if (rtdb) {
      try {
        const tokensSnap = await get(ref(rtdb, 'system/adminFcmTokens')).catch(() => null);
        if (tokensSnap && tokensSnap.exists()) {
          const tokensVal = tokensSnap.val();
          const tokenList: { token: string; isAndroid: boolean }[] = [];
          Object.values(tokensVal).forEach((entry: any) => {
            const t = entry?.token || entry;
            if (typeof t === 'string' && t.trim().length > 10) {
              const isAndroid = entry?.platform === 'android_admin_apk' || !entry?.platform;
              tokenList.push({ token: t.trim(), isAndroid });
            }
          });

          tokenList.forEach(({ token: fcmToken, isAndroid }) => {
            const tokenPayload = {
              message: {
                token: fcmToken,
                data: dataPayload,
                android: androidConfig,
                webpush: webpushConfig,
                ...(isAndroid ? {} : { notification: { title, body } }),
              },
            };

            sendPromises.push(
              fetch(
                `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(tokenPayload),
                }
              )
                .then((r) => {
                  if (r.ok) {
                    console.log('✓ FCM push dispatched to device token:', fcmToken.substring(0, 10) + '...');
                  }
                })
                .catch(() => {})
            );
          });
        }
      } catch (tokenErr) {
        console.warn('Could not query adminFcmTokens:', tokenErr);
      }
    }

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.warn('Background FCM push dispatch warning:', err);
  }
}

