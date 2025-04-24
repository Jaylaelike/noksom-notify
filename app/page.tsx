import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NotificationForm from "@/components/notification-form"
import ConfigForm from "@/components/config-form"
import SubscriptionManager from "@/components/subscription-manager"
import NotificationHistory from "@/components/notification-history"
import RoomManager from "@/components/room-manager"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import type React from 'react'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }
  return (
    <main className="container mx-auto py-6 px-4 md:px-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Push Notification Manager</h1>
        <p className="text-muted-foreground">Configure, manage, and test web push notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Dashboard</CardTitle>
          <CardDescription>Manage your push notification settings and send test notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subscribe" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              {/* <TabsTrigger value="config">Configuration</TabsTrigger> */}
              <TabsTrigger value="test">Test Notify</TabsTrigger>
              {/* <TabsTrigger value="history">History</TabsTrigger> */}
            </TabsList>
            <TabsContent value="subscribe">
              <SubscriptionManager />
            </TabsContent>
            <TabsContent value="rooms">
              <RoomManager />
            </TabsContent>
            {/* <TabsContent value="config">
              <ConfigForm />
            </TabsContent> */}
            <TabsContent value="test">
              <NotificationForm />
            </TabsContent>
            {/* <TabsContent value="history">
              <Suspense fallback={<div>Loading notification history...</div>}>
                <NotificationHistory />
              </Suspense>
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
