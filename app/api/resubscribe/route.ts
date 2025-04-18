import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { oldSubscription, newSubscription } = await request.json()

    if (!oldSubscription || !newSubscription) {
      return NextResponse.json({ error: "Missing subscription data" }, { status: 400 })
    }

    // Find the old subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { endpoint: oldSubscription.endpoint },
    })

    if (!existingSubscription) {
      // If old subscription doesn't exist, create a new one
      await prisma.subscription.create({
        data: {
          endpoint: newSubscription.endpoint,
          p256dh: newSubscription.keys?.p256dh || "",
          auth: newSubscription.keys?.auth || "",
          expirationTime: newSubscription.expirationTime?.toString() || null,
        },
      })
    } else {
      // Update the existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          endpoint: newSubscription.endpoint,
          p256dh: newSubscription.keys?.p256dh || "",
          auth: newSubscription.keys?.auth || "",
          expirationTime: newSubscription.expirationTime?.toString() || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling resubscription:", error)
    return NextResponse.json({ error: "Failed to process resubscription" }, { status: 500 })
  }
}
