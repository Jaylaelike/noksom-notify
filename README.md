## Setting Up the PWA

This Push Notification PWA allows you to configure, manage, and test web push notifications. Here's what you need to do to get it running:

### 1. Generate VAPID Keys

First, you need to generate VAPID keys for web push notifications :

```shellscript
npm install -g web-push
web-push generate-vapid-keys
```

Add these keys to your environment variables:

```shellscript
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxx
```

### Adding Notification Rooms with Token IDs

I'll extend your Push Notification PWA to support separate notification topics/rooms with unique token IDs. This will allow you to send notifications to specific groups of subscribers.

```typescriptreact project="push-notification-pwa"
...
```

## How to Use Notification Rooms

I've extended your Push Notification PWA to include notification rooms with unique token IDs. Here's how to use this new feature:

### 1. Creating a Notification Room

1. Navigate to the "Rooms" tab in your application
2. Fill in the "Room Name" (e.g., "Marketing Updates")
3. Add an optional description (e.g., "Notifications about marketing campaigns")
4. Click "Create Room"
5. A unique token ID will be automatically generated for the room


### 2. Managing Room Subscriptions

After creating rooms, you can:

- **Subscribe to a room**: Click the "Subscribe" button next to any room
- **Unsubscribe from a room**: Click the "Unsubscribe" button next to rooms you're subscribed to
- **Copy the token ID**: Click the copy icon next to the token ID to copy it to your clipboard


### 3. Sending Room-Specific Notifications

When sending notifications, you now have two options to target specific rooms:

1. **Select from dropdown**: Choose a specific room from the dropdown menu
2. **Use token ID**: Enter a room token ID directly in the "Room Token ID" field


If you don't select a room or provide a token ID, the notification will be sent to all subscribers.

### 4. Using Room Token IDs in External Applications

The room token IDs can be used to send notifications from external applications:

```shellscript
curl -X POST \
  http://localhost:3000/api/send \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Room Notification",
    "body": "This notification is sent to a specific room",
    "roomTokenId": "YOUR_ROOM_TOKEN_ID"
  }'
```