"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Bell, Shield, Palette, LogOut, Trash2, Mail, Brain, Clock, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// const ThemeToggle = dynamic(() => import("@/components/theme-toggle").then((mod) => ({ default: mod.ThemeToggle })), {
//   ssr: false,
// })
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const [email, setEmail] = useState("")
  const [notifications, setNotifications] = useState({
    email: true,
    reminders: true,
    updates: false,
    dailyReminder: false,
  })
  const [preferences, setPreferences] = useState({
    compactMode: false,
    showEmojis: true,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)
      setEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_reminder_enabled")
        .eq("id", user.id)
        .single()

      if (profile) {
        setNotifications((prev) => ({
          ...prev,
          dailyReminder: profile.daily_reminder_enabled || false,
        }))
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleDailyReminderToggle = async (checked: boolean) => {
    setNotifications({ ...notifications, dailyReminder: checked })

    if (!user) return

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      daily_reminder_enabled: checked,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error saving daily reminder preference:", error)
      alert("Erreur lors de la sauvegarde de la préférence")
      setNotifications({ ...notifications, dailyReminder: !checked })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleDeleteAccount = async () => {
    alert("La suppression de compte nécessite une confirmation par email.")
  }

  const handleSendTestReminder = async () => {
    setIsSendingTest(true)
    setTestEmailResult(null)

    try {
      const response = await fetch("/api/test-reminder", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setTestEmailResult({
          success: true,
          message: `Email de test envoyé à ${data.email} !`,
        })
      } else {
        setTestEmailResult({
          success: false,
          message: data.error || "Erreur lors de l'envoi",
        })
      }
    } catch (error) {
      setTestEmailResult({
        success: false,
        message: "Erreur de connexion",
      })
    } finally {
      setIsSendingTest(false)
      setTimeout(() => setTestEmailResult(null), 5000)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-black rounded-xl p-2.5">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Account Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 rounded-lg p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Compte</h2>
                <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-id">ID Utilisateur</Label>
                <Input id="user-id" value={user?.id || ""} disabled className="bg-muted" />
              </div>
            </div>
          </Card>

          {/* Notifications Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 rounded-lg p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Configurez vos préférences de notification</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">Recevez des emails pour les mises à jour importantes</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Label>Rappel quotidien</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recevez un email tous les jours à 18h00 UTC (19h/20h heure française) pour vous rappeler de
                      réviser
                    </p>
                  </div>
                  <Switch checked={notifications.dailyReminder} onCheckedChange={handleDailyReminderToggle} />
                </div>

                {notifications.dailyReminder && (
                  <div className="ml-6 pl-4 border-l-2 border-primary/20 space-y-3">
                    <div className="bg-primary/5 p-3 rounded-r-lg">
                      <p className="text-sm text-muted-foreground">
                        ✅ Vous recevrez un email de rappel chaque jour à <strong>18h00 UTC</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">(19h en hiver, 20h en été, heure de Paris)</p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                            🧪 Tester l'email de rappel
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                            Envoyez-vous un email de test pour voir à quoi ressemblera votre rappel quotidien
                          </p>
                          <Button
                            onClick={handleSendTestReminder}
                            disabled={isSendingTest}
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                          >
                            <Send className="h-3 w-3" />
                            {isSendingTest ? "Envoi en cours..." : "Envoyer un email de test"}
                          </Button>

                          {testEmailResult && (
                            <div
                              className={`mt-3 p-2 rounded text-xs ${
                                testEmailResult.success
                                  ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200"
                                  : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200"
                              }`}
                            >
                              {testEmailResult.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rappels d'étude</Label>
                  <p className="text-sm text-muted-foreground">Recevez des rappels pour vos sessions d'étude</p>
                </div>
                <Switch
                  checked={notifications.reminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nouvelles fonctionnalités</Label>
                  <p className="text-sm text-muted-foreground">Soyez informé des nouvelles fonctionnalités</p>
                </div>
                <Switch
                  checked={notifications.updates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Preferences Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 rounded-lg p-2">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Préférences</h2>
                <p className="text-sm text-muted-foreground">Personnalisez votre expérience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Apparence
                  </h3>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode compact</Label>
                  <p className="text-sm text-muted-foreground">Réduire l'espacement de l'interface</p>
                </div>
                <Switch
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, compactMode: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Afficher les emojis</Label>
                  <p className="text-sm text-muted-foreground">Utiliser des emojis dans les réponses de l'IA</p>
                </div>
                <Switch
                  checked={preferences.showEmojis}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, showEmojis: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Privacy & Security Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 rounded-lg p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Confidentialité et sécurité</h2>
                <p className="text-sm text-muted-foreground">Gérez vos données et votre sécurité</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Mail className="h-4 w-4" />
                Changer le mot de passe
              </Button>

              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start gap-2">
                    <Trash2 className="h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Cela supprimera définitivement votre compte et toutes vos données
                      de nos serveurs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Supprimer mon compte
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
