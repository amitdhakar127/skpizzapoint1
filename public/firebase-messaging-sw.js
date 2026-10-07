// Firebase Cloud Messaging Service Worker for SK Pizza Point Admin
// Handles instant background notifications when screen is off or browser is closed

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCCYR2QyIICr9wbS-P5X1m9860TSmmnHco",
  authDomain: "sk-pizza-point.firebaseapp.com",
  databaseURL: "https://sk-pizza-point-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sk-pizza-point",
  storageBucket: "sk-pizza-point.firebasestorage.app",
  messagingSenderId: "336176195310",
  appId: "1:336176195310:web:07deae497aa7772e7535ff"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background notification reception
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const title = payload.notification?.title || payload.data?.title || '🚨 NEW ORDER RECEIVED! — SK Pizza Point';
  const body = payload.notification?.body || payload.data?.body || 'A new customer order has been placed. Tap to open Kitchen Console.';
  const orderId = payload.data?.orderId || 'new';

  const notificationOptions = {
    body: body,
    icon: 'https://i.imgur.com/x7VzA1Q.jpeg',
    badge: 'https://i.imgur.com/x7VzA1Q.jpeg',
    tag: `order-${orderId}-${Date.now()}`,
    vibrate: [300, 100, 300, 100, 400],
    requireInteraction: true,
    data: {
      url: '/#/admin',
      orderId: orderId
    },
    actions: [
      { action: 'open_order', title: 'Open Kitchen Console' }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Open and focus Admin console when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/#/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
