import { NextResponse } from "next/server"
import { prisma } from "@/lib/prismadb"

interface Params {
  params: { roomId: string }
}

export async function GET(_request: Request, { params }: Params) {
  const { roomId } = params
  const id = parseInt(roomId, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid room ID" }, { status: 400 })
  }
  try {
    const notifications = await prisma.notification.findMany({
      where: { roomId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    const data = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
      data: n.data ? JSON.parse(n.data) : null,
    }))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching room notification history:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}