"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Copy, Check, Bell, BellOff } from "lucide-react"
import { createRoom, getRooms, subscribeToRoom, unsubscribeFromRoom } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

type Room = {
  id: number
  name: string
  description: string | null
  tokenId: string
  isSubscribed: boolean
}

export default function RoomManager() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
  })
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  useEffect(() => {
    loadRooms()
  }, [])

  async function loadRooms() {
    setIsLoading(true)
    try {
      const roomsData = await getRooms()
      setRooms(roomsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading rooms",
        description: "Failed to load notification rooms.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewRoom((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const room = await createRoom(newRoom)
      setRooms((prev) => [...prev, room])
      setNewRoom({
        name: "",
        description: "",
      })
      toast({
        title: "Room created",
        description: "Your notification room has been created successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating room",
        description: "Failed to create notification room.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyTokenId = (tokenId: string) => {
    navigator.clipboard.writeText(tokenId)
    setCopiedTokenId(tokenId)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  const handleSubscribe = async (roomId: number) => {
    try {
      await subscribeToRoom(roomId)
      setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, isSubscribed: true } : room)))
      toast({
        title: "Subscribed",
        description: "You have subscribed to this notification room.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error subscribing",
        description: "Failed to subscribe to notification room.",
      })
    }
  }

  const handleUnsubscribe = async (roomId: number) => {
    try {
      await unsubscribeFromRoom(roomId)
      setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, isSubscribed: false } : room)))
      toast({
        title: "Unsubscribed",
        description: "You have unsubscribed from this notification room.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error unsubscribing",
        description: "Failed to unsubscribe from notification room.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Notification Room</CardTitle>
          <CardDescription>Create a new room for topic-based notifications</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateRoom}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Marketing Updates"
                value={newRoom.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Notifications about marketing campaigns and updates"
                value={newRoom.description}
                onChange={handleChange}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Room
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Rooms</CardTitle>
          <CardDescription>Manage your notification rooms and subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No notification rooms created yet</div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{room.name}</h3>
                    {room.isSubscribed ? (
                      <Button variant="outline" size="sm" onClick={() => handleUnsubscribe(room.id)}>
                        <BellOff className="h-4 w-4 mr-2" />
                        Unsubscribe
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleSubscribe(room.id)}>
                        <Bell className="h-4 w-4 mr-2" />
                        Subscribe
                      </Button>
                    )}
                  </div>
                  {room.description && <p className="text-sm text-muted-foreground">{room.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Token ID</Badge>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{room.tokenId}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyTokenId(room.tokenId)}
                      title="Copy Token ID"
                    >
                      {copiedTokenId === room.tokenId ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
