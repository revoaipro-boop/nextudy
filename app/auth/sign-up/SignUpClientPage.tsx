"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from 'lucide-react'

export default function SignUpClientPage() {
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions d'utilisation pour continuer.")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setEmailSent(false)

    try {
      console.log("[v0] Starting sign up process")
      console.log("[v0] Email:", email)

      const randomPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)

      const { data, error } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          emailRedirectTo: null,
          data: {
            display_name: displayName || "Utilisateur",
          },
        },
      })

      if (error) {
        console.error("[v0] Supabase signup error:", error)
        throw error
      }

      console.log("[v0] User created successfully")
      console.log("[v0] User ID:", data.user?.id)

      if (data.user) {
        await supabase.auth.signOut()
        console.log("[v0] User signed out to prevent auto-login")

        console.log("[v0] Sending admin notification...")

        try {
          const response = await fetch("/api/auth/notify-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: displayName || "Utilisateur",
              userId: data.user.id,
              email: email,
            }),
          })

          console.log("[v0] Admin notification response status:", response.status)

          const result = await response.json()
          console.log("[v0] Admin notification response:", result)

          if (!response.ok) {
            console.error("[v0] Admin notification failed")
            console.error("[v0] Error details:", result)
            setError(
              `Compte créé mais notification admin échouée: ${result.error || "Erreur inconnue"}. Détails: ${JSON.stringify(result.details || {})}`,
            )
          } else {
            console.log("[v0] Admin notification sent successfully")
            setEmailSent(true)
          }
        } catch (emailError) {
          console.error("[v0] Exception while sending admin notification:", emailError)
          setError(
            `Compte créé mais notification admin échouée: ${emailError instanceof Error ? emailError.message : "Erreur inconnue"}`,
          )
        }
      }

      console.log("[v0] Redirecting to success page in 2 seconds...")
      setTimeout(() => {
        router.push("/auth/sign-up-success")
      }, 2000)
    } catch (error: unknown) {
      console.error("[v0] Sign up error:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <InfoIcon className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-100 font-semibold">Information importante</AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm space-y-2">
            <p>
              Si vous souhaitez obtenir un accès contactez-nous sur Instagram :{" "}
              <a
                href="https://www.instagram.com/nextudy_fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-orange-900"
              >
                @nextudy_fr
              </a>
            </p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Inscription</CardTitle>
            <CardDescription>Créez votre compte Nextudy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Nom d&apos;affichage</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Votre nom"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    J'accepte les{" "}
                    <Link
                      href="/conditions-utilisation"
                      target="_blank"
                      className="text-primary underline hover:no-underline"
                    >
                      conditions d'utilisation
                    </Link>
                  </Label>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {emailSent && <p className="text-sm text-green-600">✓ Notification envoyée à l&apos;administrateur</p>}

                <Button type="submit" className="w-full" disabled={isLoading || !acceptedTerms}>
                  {isLoading ? "Création du compte..." : "S'inscrire"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Déjà un compte ?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
