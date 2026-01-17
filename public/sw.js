// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/images/icon-check.svg',
    badge: '/images/icon-check.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Logic for local timer notifications while closed
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = event.data;
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/images/icon-check.svg'
      });
    }, delay);
  }
});