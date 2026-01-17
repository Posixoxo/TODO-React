// public/sw.js

// 1. Install Event: Force this new SW to become active immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Activate Event: Take control of all open clients (tabs) instantly
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 3. Message Event: Handle the "Schedule" command
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = event.data;

    // Create a promise that resolves only after the timeout completes
    // This trick keeps the Service Worker "alive" in the background
    const notificationPromise = new Promise((resolve) => {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body: body,
          icon: '/logo192.png',  // Ensure this file exists in /public
          badge: '/logo192.png', // Android small icon
          vibrate: [200, 100, 200], // Vibration pattern
          tag: 'todo-' + Date.now(), // Unique tag prevents overwriting
          renotify: true, // Force vibration/sound even if old notifications exist
          requireInteraction: true, // Keep notification visible until clicked (Desktop)
          data: { url: self.location.origin } // Store URL to open on click
        });
        resolve(); // Resolve promise to let the SW finish
      }, delay);
    });

    // CRITICAL: Tells the OS "Don't kill me yet, I have work to do!"
    event.waitUntil(notificationPromise);
  }
});

// 4. Notification Click Event: Open or Focus the App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, just focus the tab
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // If the app is closed, open a new window
      return clients.openWindow('/');
    })
  );
});