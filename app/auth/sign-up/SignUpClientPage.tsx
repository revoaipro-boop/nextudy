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

  const handleGoogleSignUp = async () => {
    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions d'utilisation pour continuer.")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) {
        throw error
      }
    } catch (error: unknown) {
      console.error("[v0] Google signup error:", error)
      setError(error instanceof Error ? error.message : "Erreur lors de l'inscription avec Google")
      setIsLoading(false)
    }
  }

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
            <CardDescription>Créez votre compte Nextudy avec Google ou par email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={isLoading || !acceptedTerms}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>
            </div>

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
                  {isLoading ? "Création du compte..." : "S'inscrire par email"}
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
