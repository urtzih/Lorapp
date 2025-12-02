/**
 * Service Worker for push notifications and offline support.
 * Handles push events and displays notifications.
 */

// Import Workbox libraries for caching (if using Vite PWA plugin, this is automatic)

// Listen for push events
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const { title, body, icon, badge, data: payload } = data;

    const options = {
        body,
        icon: icon || '/icons/icon-192x192.png',
        badge: badge || '/icons/badge-96x96.png',
        data: payload,
        vibrate: [200, 100, 200],
        tag: payload?.type || 'notification',
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background sync for offline actions (optional)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-seeds') {
        event.waitUntil(syncSeeds());
    }
});

async function syncSeeds() {
    // Sync pending seed uploads when back online
    console.log('Syncing seeds...');
}
