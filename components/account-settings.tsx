"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Mail, MessageSquare } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface AccountSettingsProps {
  user: User
  profile: any
}

export function AccountSettings({ user, profile }: AccountSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [summaryReminders, setSummaryReminders] = useState(true)

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Gérez vos préférences de notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif" className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notifications par email
              </Label>
              <p className="text-sm text-muted-foreground">Recevez des emails pour les mises à jour importantes</p>
            </div>
            <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notif" className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notifications push
              </Label>
              <p className="text-sm text-muted-foreground">Recevez des notifications sur votre appareil</p>
            </div>
            <Switch id="push-notif" checked={pushNotifications} onCheckedChange={setPushNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="summary-reminders" className="text-base">
                Rappels de révision
              </Label>
              <p className="text-sm text-muted-foreground">Recevez des rappels pour réviser vos résumés</p>
            </div>
            <Switch id="summary-reminders" checked={summaryReminders} onCheckedChange={setSummaryReminders} />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg">Enregistrer les modifications</Button>
      </div>
    </div>
  )
}
