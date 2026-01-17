// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Listen for the "Schedule" message from App.jsx
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = event.data;

    // Background timer
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        tag: 'todo-reminder', // Ensures only one notification shows at a time
        renotify: true,
        data: { url: self.location.origin } 
      });
    }, delay);
  }
});

// When user clicks the notification, open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});