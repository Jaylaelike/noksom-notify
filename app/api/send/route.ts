import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import webpush from "web-push"

const prisma = new PrismaClient()

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:example@example.com", // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || "",
)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.title || !data.body) {
      return NextResponse.json({ error: "Missing required fields: title and body" }, { status: 400 })
    }

    // Check if a room token ID is provided
    let roomId = data.roomId
    if (data.roomTokenId && !roomId) {
      const room = await prisma.room.findUnique({
        where: { tokenId: data.roomTokenId },
      })

      if (room) {
        roomId = room.id
      } else {
        return NextResponse.json({ error: "Invalid room token ID" }, { status: 404 })
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
      return NextResponse.json({ error: "No active subscriptions found" }, { status: 404 })
    }

    // Create notification payload
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      data: {
        ...data.data,
        roomId,
      },
    })

    // Save notification to history
    const savedNotification = await prisma.notification.create({
      data: {
        title: data.title,
        body: data.body,
        icon: data.icon || "/icons/icon-192x192.png",
        data: data.data ? JSON.stringify(data.data) : null,
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

    const successCount = results.filter((r) => r.status === "fulfilled" && r.value).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: subscriptions.length,
      notificationId: savedNotification.id,
      roomId,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
