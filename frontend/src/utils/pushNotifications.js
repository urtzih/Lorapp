/**
 * Web Push Notifications utility.
 * Handles subscription, permission requests, and push notification setup.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
    try {
        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Convert subscription to JSON
        const subscriptionData = subscription.toJSON();

        return {
            endpoint: subscriptionData.endpoint,
            expirationTime: subscriptionData.expirationTime,
            keys: subscriptionData.keys,
        };
    } catch (error) {
        console.error('Failed to subscribe to push:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            return subscription.endpoint;
        }

        return null;
    } catch (error) {
        console.error('Failed to unsubscribe from push:', error);
        throw error;
    }
}

/**
 * Check if user is currently subscribed to push
 */
export async function isPushSubscribed() {
    try {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        console.error('Failed to check push subscription:', error);
        return false;
    }
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}
