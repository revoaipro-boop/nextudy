"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AvatarPreview } from "@/components/avatar-preview"
import type { User } from "@supabase/supabase-js"

interface ProfileFormProps {
  user: User
  profile: {
    display_name: string | null
    bio: string | null
    avatar_type?: string | null
    avatar_accessories?: string[] | null
    avatar_background?: string | null
    avatar_background_color?: string | null
  } | null
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName,
        bio: bio,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setMessage({ type: "success", text: "Profil mis à jour avec succès !" })
      router.refresh()
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {profile?.avatar_type && (
        <div className="flex justify-center pb-4">
          <AvatarPreview
            avatarType={profile.avatar_type}
            accessories={(profile.avatar_accessories as string[]) || []}
            background={profile.avatar_background || "gradient-blue"}
            backgroundColor={profile.avatar_background_color}
            size="lg"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={user.email} disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Nom d&apos;affichage</Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Votre nom"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Parlez-nous de vous..."
          rows={4}
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={handleSignOut} className="w-full sm:w-auto bg-transparent">
          Se déconnecter
        </Button>
      </div>
    </form>
  )
}
