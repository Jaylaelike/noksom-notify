import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getNotificationHistory } from "@/app/actions"
import { formatDistanceToNow } from "date-fns"
import { Bell } from "lucide-react"
import Link from "next/link"

export default async function NotificationHistory() {
  const notifications = await getNotificationHistory()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification History</CardTitle>
        <CardDescription>Recent notifications sent from this application</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No notifications have been sent yet</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
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

                  {notification.room && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Room: {notification.room.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Token: {notification.room.tokenId.substring(0, 8)}...
                      </span>
                    </div>
                  )}

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
      </CardContent>
    </Card>
  )
}
