import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/profile-form"
import { AchievementsGraph } from "@/components/achievements-graph"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Trophy, Settings } from "lucide-react"
import { AccountSettings } from "@/components/account-settings"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: achievements } = await supabase.from("user_achievements").select("*").eq("user_id", user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:scale-105 transition-transform">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
        <div className="mb-8">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h1 className="text-3xl font-bold">{profile?.display_name || "Utilisateur"}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                {profile?.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
              </div>
              {achievements && (
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-violet-600">{achievements.total_points || 0}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{achievements.summaries_created || 0}</div>
                    <div className="text-xs text-muted-foreground">Résumés</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 gap-1">
            <TabsTrigger value="profile" className="gap-2 py-3">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2 py-3">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informations du Profil</CardTitle>
                <CardDescription>Gérez vos informations personnelles</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} profile={profile} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsGraph />
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettings user={user} profile={profile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
