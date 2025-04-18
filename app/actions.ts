"use server"

import { PrismaClient } from "@prisma/client"
import webpush from "web-push"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:example@example.com", // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || "",
)

// Save a new subscription
export async function subscribeUser(subscription: PushSubscription) {
  try {
    await prisma.subscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || "",
        auth: subscription.keys?.auth || "",
        expirationTime: subscription.expirationTime?.toString() || null,
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error saving subscription:", error)
    return { success: false, error: "Failed to save subscription" }
  }
}

// Remove a subscription
export async function unsubscribeUser() {
  try {
    // In a real app, you'd identify the specific subscription to delete
    // For simplicity, we're not implementing this fully
    return { success: true }
  } catch (error) {
    console.error("Error removing subscription:", error)
    return { success: false, error: "Failed to remove subscription" }
  }
}

// Save notification configuration
export async function saveConfig(config: {
  endpoint: string
  authKey: string
  headers: string
  payload: string
}) {
  try {
    // Parse JSON strings to objects
    let headers = {}
    let payload = {}

    try {
      if (config.headers) headers = JSON.parse(config.headers)
      if (config.payload) payload = JSON.parse(config.payload)
    } catch (e) {
      return { success: false, error: "Invalid JSON in headers or payload" }
    }

    // Upsert configuration (create or update)
    await prisma.config.upsert({
      where: { id: 1 }, // Assuming a single config record
      update: {
        endpoint: config.endpoint,
        authKey: config.authKey,
        headers: config.headers,
        payload: config.payload,
      },
      create: {
        id: 1,
        endpoint: config.endpoint,
        authKey: config.authKey,
        headers: config.headers,
        payload: config.payload,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error saving configuration:", error)
    return { success: false, error: "Failed to save configuration" }
  }
}

// Create a new notification room
export async function createRoom(room: { name: string; description: string }) {
  try {
    // Generate a unique token ID for the room
    const tokenId = uuidv4()

    const newRoom = await prisma.room.create({
      data: {
        name: room.name,
        description: room.description,
        tokenId,
      },
    })

    return {
      id: newRoom.id,
      name: newRoom.name,
      description: newRoom.description,
      tokenId: newRoom.tokenId,
      isSubscribed: false,
    }
  } catch (error) {
    console.error("Error creating room:", error)
    throw new Error("Failed to create notification room")
  }
}

// Get all notification rooms
export async function getRooms() {
  try {
    // Get the current user's subscription (in a real app, you'd use authentication)
    // For simplicity, we'll just get the first subscription
    const userSubscription = await prisma.subscription.findFirst({
      orderBy: { createdAt: "desc" },
    })

    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: "desc" },
    })

    // If we have a user subscription, check which rooms they're subscribed to
    if (userSubscription) {
      const userRoomSubscriptions = await prisma.roomSubscription.findMany({
        where: { subscriptionId: userSubscription.id },
      })

      const subscribedRoomIds = new Set(userRoomSubscriptions.map((sub) => sub.roomId))

      return rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        tokenId: room.tokenId,
        isSubscribed: subscribedRoomIds.has(room.id),
      }))
    }

    // If no user subscription, return rooms with isSubscribed = false
    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      tokenId: room.tokenId,
      isSubscribed: false,
    }))
  } catch (error) {
    console.error("Error getting rooms:", error)
    throw new Error("Failed to get notification rooms")
  }
}

// Subscribe to a room
export async function subscribeToRoom(roomId: number) {
  try {
    // Get the current user's subscription (in a real app, you'd use authentication)
    const userSubscription = await prisma.subscription.findFirst({
      orderBy: { createdAt: "desc" },
    })

    if (!userSubscription) {
      throw new Error("You must be subscribed to push notifications first")
    }

    // Check if the room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      throw new Error("Notification room not found")
    }

    // Check if already subscribed
    const existingSubscription = await prisma.roomSubscription.findFirst({
      where: {
        roomId,
        subscriptionId: userSubscription.id,
      },
    })

    if (existingSubscription) {
      return { success: true, alreadySubscribed: true }
    }

    // Create the room subscription
    await prisma.roomSubscription.create({
      data: {
        roomId,
        subscriptionId: userSubscription.id,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error subscribing to room:", error)
    throw new Error("Failed to subscribe to notification room")
  }
}

// Unsubscribe from a room
export async function unsubscribeFromRoom(roomId: number) {
  try {
    // Get the current user's subscription (in a real app, you'd use authentication)
    const userSubscription = await prisma.subscription.findFirst({
      orderBy: { createdAt: "desc" },
    })

    if (!userSubscription) {
      throw new Error("No subscription found")
    }

    // Delete the room subscription
    await prisma.roomSubscription.deleteMany({
      where: {
        roomId,
        subscriptionId: userSubscription.id,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error unsubscribing from room:", error)
    throw new Error("Failed to unsubscribe from notification room")
  }
}

// Send a notification
export async function sendNotification(notification: {
  title: string
  body: string
  icon?: string
  data?: any
  roomId?: number
  roomTokenId?: string
}) {
  try {
    let roomId = notification.roomId

    // If a room token ID is provided, find the corresponding room
    if (notification.roomTokenId && !roomId) {
      const room = await prisma.room.findUnique({
        where: { tokenId: notification.roomTokenId },
      })

      if (room) {
        roomId = room.id
      } else {
        return { success: false, error: "Invalid room token ID" }
      }
    }

    // Get subscriptions based on room
    let subscriptions
    if (roomId) {
      // Get subscriptions for the specific room
      const roomSubscriptions = await prisma.roomSubscription.findMany({
        where: { roomId },
        include: { subscription: true },
      })

      subscriptions = roomSubscriptions.map((rs) => rs.subscription)
    } else {
      // Get all subscriptions if no room specified
      subscriptions = await prisma.subscription.findMany()
    }

    if (subscriptions.length === 0) {
      return { success: false, error: "No active subscriptions found" }
    }

    // Get configuration
    const config = await prisma.config.findUnique({
      where: { id: 1 },
    })

    // Create notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/icons/icon-192x192.png",
      data: {
        ...notification.data,
        roomId,
      },
    })

    // Save notification to history
    const savedNotification = await prisma.notification.create({
      data: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/icons/icon-192x192.png",
        data: notification.data ? JSON.stringify(notification.data) : null,
        roomId,
      },
    })

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            expirationTime: sub.expirationTime ? Number.parseInt(sub.expirationTime) : null,
          }

          await webpush.sendNotification(subscription as any, payload)
          return true
        } catch (error) {
          console.error(`Error sending to subscription ${sub.id}:`, error)
          // If subscription is expired or invalid, remove it
          if ((error as any).statusCode === 410) {
            await prisma.subscription.delete({
              where: { id: sub.id },
            })
          }
          return false
        }
      }),
    )

    // If config has an endpoint, also send via HTTP POST
    if (config?.endpoint) {
      try {
        let headers: Record<string, string> = {
          "Content-Type": "application/json",
        }

        if (config.authKey) {
          headers["Authorization"] = config.authKey
        }

        if (config.headers) {
          try {
            const customHeaders = JSON.parse(config.headers)
            headers = { ...headers, ...customHeaders }
          } catch (e) {
            console.error("Invalid headers JSON:", e)
          }
        }

        let postPayload = payload
        if (config.payload) {
          try {
            const template = JSON.parse(config.payload)
            const data = {
              title: notification.title,
              body: notification.body,
              icon: notification.icon || "/icons/icon-192x192.png",
              roomId: roomId || null,
              ...notification.data,
            }

            // Replace template variables
            const processedTemplate = JSON.stringify(template).replace(/{{(\w+)}}/g, (_, key) => data[key] || "")

            postPayload = processedTemplate
          } catch (e) {
            console.error("Invalid payload template:", e)
          }
        }

        await fetch(config.endpoint, {
          method: "POST",
          headers,
          body: postPayload,
        })
      } catch (error) {
        console.error("Error sending HTTP POST notification:", error)
      }
    }

    const successCount = results.filter((r) => r.status === "fulfilled" && r.value).length

    return {
      success: true,
      sent: successCount,
      total: subscriptions.length,
      notificationId: savedNotification.id,
      roomId,
    }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

// Get notification history
export async function getNotificationHistory() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        room: {
          select: {
            name: true,
            tokenId: true,
          },
        },
      },
      take: 10,
    })

    return notifications.map((notification) => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null,
    }))
  } catch (error) {
    console.error("Error fetching notification history:", error)
    return []
  }
}
