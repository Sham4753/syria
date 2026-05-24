self.addEventListener('push', function(event) {
    var data = event.data ? event.data.json() : {};
    self.registration.showNotification(data.title || 'سوريا الإلكترونية', {
        body: data.body || 'لديك إشعار جديد',
        icon: data.icon || '/icon.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' }
    });
});
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
