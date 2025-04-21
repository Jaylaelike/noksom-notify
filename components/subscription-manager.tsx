"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { subscribeUser, unsubscribeUser } from "@/app/actions"
import { Bell, BellOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function SubscriptionManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error("Service worker registration failed:", error)
    }
  }

  async function subscribeToPush() {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
      })
      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
      }
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Supported</AlertTitle>
        <AlertDescription>
          Push notifications are not supported in this browser. Please try a different browser.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Subscription</CardTitle>
          <CardDescription>Subscribe to receive push notifications from this application</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-500" />
                <span>You are subscribed to push notifications</span>
              </div>
              <Button variant="outline" onClick={unsubscribeFromPush} disabled={isLoading}>
                <BellOff className="h-4 w-4 mr-2" />
                Unsubscribe
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff className="h-5 w-5 text-gray-500" />
                <span>You are not subscribed to push notifications</span>
              </div>
              <Button onClick={subscribeToPush} disabled={isLoading}>
                <Bell className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isIOS && !isStandalone && (
        <Card>
          <CardHeader>
            <CardTitle>Install as App</CardTitle>
            <CardDescription>For the best experience on iOS, install this app to your home screen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              To install this app on your iOS device, tap the share button
              <span role="img" aria-label="share icon">
                {" "}
                ⎋{" "}
              </span>
              and then "Add to Home Screen"
              <span role="img" aria-label="plus icon">
                {" "}
                ➕{" "}
              </span>
              .
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
