// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});

// Listen for the "Schedule" message from App.jsx
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = event.data;

    // We wrap the timeout in a Promise to keep the Service Worker alive
    const notificationPromise = new Promise((resolve) => {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body: body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          // Using a unique tag or timestamp prevents iOS from collapsing notifications
          tag: 'todo-reminder-' + Date.now(), 
          renotify: true,
          requireInteraction: true, // Keeps it on screen until user dismisses (Desktop)
          data: { url: self.location.origin }
        });
        resolve();
      }, delay);
    });

    // CRITICAL: Tells the OS to keep the Service Worker running for the duration of the timer
    event.waitUntil(notificationPromise);
  }
});

// When user clicks the notification, open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // Otherwise, open a new window
      return clients.openWindow('/');
    })
  );
});