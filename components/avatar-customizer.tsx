"use client"

import { useState } from "react"
import { AvatarPreview } from "./avatar-preview"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Sparkles, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarCustomizerProps {
  initialAvatarType?: string
  initialAccessories?: string[]
  initialBackground?: string
  initialBackgroundColor?: string | null
  onSave: (data: {
    avatarType: string
    accessories: string[]
    background: string
    backgroundColor: string | null
  }) => Promise<void>
}

const avatarOptions = [
  { id: "default", label: "Défaut", emoji: "👤" },
  { id: "cat", label: "Chat", emoji: "🐱" },
  { id: "dog", label: "Chien", emoji: "🐶" },
  { id: "robot", label: "Robot", emoji: "🤖" },
  { id: "alien", label: "Alien", emoji: "👽" },
  { id: "panda", label: "Panda", emoji: "🐼" },
  { id: "fox", label: "Renard", emoji: "🦊" },
  { id: "lion", label: "Lion", emoji: "🦁" },
  { id: "unicorn", label: "Licorne", emoji: "🦄" },
  { id: "dragon", label: "Dragon", emoji: "🐉" },
]

const accessoryOptions = [
  { id: "glasses", label: "Lunettes", emoji: "👓" },
  { id: "sunglasses", label: "Lunettes de soleil", emoji: "🕶️" },
  { id: "hat", label: "Chapeau", emoji: "🎩" },
  { id: "cap", label: "Casquette", emoji: "🧢" },
  { id: "crown", label: "Couronne", emoji: "👑" },
  { id: "headphones", label: "Casque audio", emoji: "🎧" },
  { id: "party", label: "Fête", emoji: "🎉" },
  { id: "star", label: "Étoile", emoji: "⭐" },
]

const backgroundOptions = [
  { id: "gradient-blue", label: "Bleu", preview: "bg-gradient-to-br from-blue-400 to-blue-600" },
  { id: "gradient-purple", label: "Violet", preview: "bg-gradient-to-br from-purple-400 to-purple-600" },
  { id: "gradient-pink", label: "Rose", preview: "bg-gradient-to-br from-pink-400 to-pink-600" },
  { id: "gradient-green", label: "Vert", preview: "bg-gradient-to-br from-green-400 to-green-600" },
  { id: "gradient-orange", label: "Orange", preview: "bg-gradient-to-br from-orange-400 to-orange-600" },
  {
    id: "gradient-rainbow",
    label: "Arc-en-ciel",
    preview: "bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400",
  },
]

const solidColors = [
  { id: "#3b82f6", label: "Bleu" },
  { id: "#8b5cf6", label: "Violet" },
  { id: "#ec4899", label: "Rose" },
  { id: "#10b981", label: "Vert" },
  { id: "#f59e0b", label: "Orange" },
  { id: "#ef4444", label: "Rouge" },
  { id: "#6366f1", label: "Indigo" },
  { id: "#14b8a6", label: "Turquoise" },
]

export function AvatarCustomizer({
  initialAvatarType = "default",
  initialAccessories = [],
  initialBackground = "gradient-blue",
  initialBackgroundColor = null,
  onSave,
}: AvatarCustomizerProps) {
  const [avatarType, setAvatarType] = useState(initialAvatarType)
  const [accessories, setAccessories] = useState<string[]>(initialAccessories)
  const [background, setBackground] = useState(initialBackground)
  const [backgroundColor, setBackgroundColor] = useState<string | null>(initialBackgroundColor)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    console.log("[v0] Saving avatar with data:", {
      avatarType,
      accessories: [],
      background,
      backgroundColor,
    })

    try {
      await onSave({
        avatarType,
        accessories: [],
        background,
        backgroundColor,
      })
      console.log("[v0] Avatar saved successfully")
      setMessage({ type: "success", text: "Avatar personnalisé avec succès !" })
    } catch (error) {
      console.error("[v0] Error saving avatar:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-8">
      {/* Sticky Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex justify-center">
          <AvatarPreview
            avatarType={avatarType}
            accessories={[]}
            background={background}
            backgroundColor={backgroundColor}
            size="xl"
          />
        </div>
      </div>

      {/* Customization Options */}
      <div className="space-y-8">
        {/* Avatar Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Choisis ton avatar
            </CardTitle>
            <CardDescription>Sélectionne un personnage qui te représente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {avatarOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAvatarType(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                    avatarType === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Background */}
        <Card>
          <CardHeader>
            <CardTitle>Fond</CardTitle>
            <CardDescription>Personnalise le fond de ton avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Dégradés</Label>
              <div className="grid grid-cols-3 gap-3">
                {backgroundOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setBackground(option.id)
                      setBackgroundColor(null)
                    }}
                    className={cn(
                      "relative h-16 rounded-lg border-2 transition-all hover:scale-105",
                      option.preview,
                      background === option.id ? "border-primary ring-2 ring-primary" : "border-border",
                    )}
                  >
                    {background === option.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <span className="sr-only">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Couleurs unies</Label>
              <div className="grid grid-cols-4 gap-3">
                {solidColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => {
                      setBackground("solid")
                      setBackgroundColor(color.id)
                    }}
                    className={cn(
                      "relative h-16 rounded-lg border-2 transition-all hover:scale-105",
                      background === "solid" && backgroundColor === color.id
                        ? "border-primary ring-2 ring-primary"
                        : "border-border",
                    )}
                    style={{ backgroundColor: color.id }}
                  >
                    {background === "solid" && backgroundColor === color.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <span className="sr-only">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col gap-4">
          {message && (
            <p
              className={cn("text-sm text-center", message.type === "success" ? "text-green-600" : "text-destructive")}
            >
              {message.text}
            </p>
          )}
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full">
            {isSaving ? "Enregistrement..." : "Enregistrer mon avatar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
