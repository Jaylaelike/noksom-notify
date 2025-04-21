"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendNotification, getRooms } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"

type Room = {
  id: number
  name: string
  tokenId: string
}

export default function NotificationForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [notification, setNotification] = useState({
    title: "",
    body: "",
    icon: "/icons/icon-192x192.png",
    data: "",
    roomId: "",
    roomTokenId: "",
  })

  useEffect(() => {
    async function loadRooms() {
      try {
        const roomsData = await getRooms()
        setRooms(roomsData)
      } catch (error) {
        console.error("Failed to load rooms:", error)
      }
    }

    loadRooms()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNotification((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoomChange = (value: string) => {
    setNotification((prev) => ({ ...prev, roomId: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let data = {}
      if (notification.data) {
        try {
          data = JSON.parse(notification.data)
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Invalid JSON",
            description: "The data field contains invalid JSON.",
          })
          setIsLoading(false)
          return
        }
      }

      const result = await sendNotification({
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        data,
        roomId: notification.roomId ? Number.parseInt(notification.roomId) : undefined,
        roomTokenId: notification.roomTokenId || undefined,
      })

      if (result.success) {
        toast({
          title: "Notification sent",
          description: `Your test notification has been sent successfully to ${result.sent} device(s).`,
        })
      } else {
        throw new Error(result.error || "Failed to send notification")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error sending notification",
        description: error instanceof Error ? error.message : "There was a problem sending your notification.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Test Notification</CardTitle>
          <CardDescription>Send a test push notification to subscribed devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="New Message"
              value={notification.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Notification Body</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="This is a test notification"
              value={notification.body}
              onChange={handleChange}
              required
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon URL</Label>
            <Input
              id="icon"
              name="icon"
              placeholder="/icons/icon-192x192.png"
              value={notification.icon}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Room (Optional)</Label>
            <Select value={notification.roomId} onValueChange={handleRoomChange}>
              <SelectTrigger>
                <SelectValue placeholder="Send to all subscribers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscribers</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Select a room to send notifications only to subscribers of that room
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomTokenId">Room Token ID (Optional)</Label>
            <Input
              id="roomTokenId"
              name="roomTokenId"
              placeholder="Enter room token ID"
              value={notification.roomTokenId}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground mt-1">Alternatively, you can enter a room token ID directly</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Additional Data (JSON)</Label>
            <Textarea
              id="data"
              name="data"
              placeholder='{"url": "/dashboard", "timestamp": 1617293982}'
              value={notification.data}
              onChange={handleChange}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Notification
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
