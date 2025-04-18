// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  return self.clients.claim()
})

self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json()

      const options = {
        body: data.body,
        icon: data.icon || "/icons/icon-192x192.png",
        badge: "/icons/badge-96x96.png",
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag || "default",
        renotify: data.renotify || false,
        requireInteraction: data.requireInteraction || false,
      }

      event.waitUntil(self.registration.showNotification(data.title, options))
    } catch (error) {
      console.error("Error showing notification:", error)
    }
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    fetch("/api/resubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldSubscription: event.oldSubscription,
        newSubscription: event.newSubscription,
      }),
    }),
  )
})
