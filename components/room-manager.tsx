"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Copy, Check, Bell, BellOff, Edit, Trash, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createRoom, getRooms, subscribeToRoom, unsubscribeFromRoom, updateRoom, deleteRoom } from "@/app/actions"
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
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
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [editData, setEditData] = useState({ name: "", description: "" })
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false)

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
  
  // Open edit dialog for a room
  const openEditDialog = (room: Room) => {
    setEditRoom(room)
    setEditData({ name: room.name, description: room.description || "" })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }

  // Submit updated room data
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editRoom) return
    setIsUpdatingRoom(true)
    try {
      const updated = await updateRoom({ id: editRoom.id, name: editData.name, description: editData.description })
      setRooms((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, name: updated.name, description: updated.description } : r))
      )
      toast({
        title: "Room updated",
        description: "Your notification room has been updated successfully.",
      })
      setEditRoom(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating room",
        description: "Failed to update notification room.",
      })
    } finally {
      setIsUpdatingRoom(false)
    }
  }

  // Delete room
  const handleDelete = async (roomId: number) => {
    try {
      const deleted = await deleteRoom(roomId)
      setRooms((prev) => prev.filter((r) => r.id !== deleted.id))
      toast({
        title: "Room deleted",
        description: "Your notification room has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting room",
        description: "Failed to delete notification room.",
      })
    }
  }
  // History state for room notifications
  const [historyRoom, setHistoryRoom] = useState<Room | null>(null)
  const [historyItems, setHistoryItems] = useState<Array<{ id: number; title: string; body: string; createdAt: string; data: any }>>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Open history dialog for a room
  const openHistory = async (room: Room) => {
    setHistoryRoom(room)
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`/api/rooms/${room.id}/history`)
      if (!res.ok) throw new Error("Failed to fetch history")
      const data = await res.json()
      setHistoryItems(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching history",
        description: "Failed to fetch room notification history.",
      })
    } finally {
      setIsLoadingHistory(false)
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
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openHistory(room)}
                        title="View History"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(room)}
                        title="Edit Room"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" title="Delete Room">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this room?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(room.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Room Dialog */}
      {editRoom && (
        <Dialog open onOpenChange={(open) => { if (!open) setEditRoom(null) }}>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>Update your notification room details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-2 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Room Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isUpdatingRoom}>
                  {isUpdatingRoom ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {historyRoom && (
        <Dialog open onOpenChange={(open) => { if (!open) setHistoryRoom(null) }}>
          <DialogOverlay />
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>History for {historyRoom.name}</DialogTitle>
              <DialogDescription>Recent notifications for this room</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {isLoadingHistory ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
              ) : historyItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No notifications have been sent to this room yet.</div>
              ) : (
          <div className="space-y-4 overflow-y-auto pr-2 max-h-[60vh] pb-2">
            {historyItems.map((notification) => (
              <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <Bell className="h-5 w-5 mt-1 text-primary" />
                <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{notification.title}</h4>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{notification.body}</p>
            {notification.data && (
              <>
                <details className="text-xs">
                  <summary className="cursor-pointer text-primary">View data</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
              {JSON.stringify(notification.data, null, 2)}
                  </pre>
                </details>
                {notification.data.url && (
                  <Link href={notification.data.url} className="text-xs text-primary underline">
              View details
                  </Link>
                )}
              </>
            )}
                </div>
              </div>
            ))}
          </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
