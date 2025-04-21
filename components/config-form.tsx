"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveConfig } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function ConfigForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    endpoint: "",
    authKey: "",
    headers: "",
    payload: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await saveConfig(config)
      toast({
        title: "Configuration saved",
        description: "Your notification configuration has been saved successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving configuration",
        description: "There was a problem saving your configuration.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Notification Configuration</CardTitle>
          <CardDescription>Configure the POST parameters for your push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint URL</Label>
            <Input
              id="endpoint"
              name="endpoint"
              placeholder="https://api.example.com/notifications"
              value={config.endpoint}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authKey">Authorization Key</Label>
            <Input
              id="authKey"
              name="authKey"
              placeholder="Bearer token or API key"
              value={config.authKey}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headers">Custom Headers (JSON)</Label>
            <Textarea
              id="headers"
              name="headers"
              placeholder='{"Content-Type": "application/json", "X-Custom-Header": "value"}'
              value={config.headers}
              onChange={handleChange}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payload">Default Payload Template (JSON)</Label>
            <Textarea
              id="payload"
              name="payload"
              placeholder='{"title": "{{title}}", "body": "{{body}}", "icon": "/icons/icon-192x192.png"}'
              value={config.payload}
              onChange={handleChange}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
