"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPageClient() {
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const errorParam = searchParams.get("error")
    const messageParam = searchParams.get("message")

    if (errorParam) {
      setErrorCode(errorParam)
    }

    if (messageParam) {
      setError(decodeURIComponent(messageParam))
    } else if (errorParam === "account_pending") {
      setError("Votre compte n'a pas encore été validé par l'administrateur.")
    } else if (errorParam === "session_expired") {
      setError("Veuillez vous reconnecter.")
    } else if (errorParam === "account_not_activated") {
      setError(
        "Votre compte n'a pas encore été validé par l'administrateur. Vous recevrez un email une fois votre compte activé.",
      )
    }
  }, [searchParams])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          console.log("[v0] User already logged in, redirecting to home")
          router.push("/")
        }
      } catch (error) {
        console.log("[v0] Auth check failed:", error)
        await supabase.auth.signOut()
      }
    }
    checkSession()
  }, [supabase, router])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setDevCode(null)

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError(data.error || "Aucun compte trouvé avec cet email.")
          setIsLoading(false)
          return
        }
        throw new Error(data.error || "Une erreur est survenue")
      }

      setSuccess(data.message)
      if (data.isDev && data.devCode) {
        setDevCode(data.devCode)
      }
      setStep("code")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Verifying code for email:", email)

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Code incorrect ou expiré")
      }

      console.log("[v0] Code verified successfully")

      if (data.access_token && data.refresh_token) {
        console.log("[v0] Setting session with tokens")
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        if (sessionError) {
          throw new Error("Erreur lors de la création de la session: " + sessionError.message)
        }

        console.log("[v0] Session created, redirecting to home")
        window.location.href = "/"
      } else {
        throw new Error("Aucun token d'authentification reçu du serveur")
      }
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
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
      console.error("[v0] Google login error:", error)
      setError(error instanceof Error ? error.message : "Erreur lors de la connexion Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Connexion</CardTitle>
            <CardDescription className="text-sm">
              {step === "email"
                ? "Connectez-vous avec Google ou par email"
                : "Entrez le code à 4 chiffres envoyé par email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <div className="flex flex-col gap-4 sm:gap-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
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

                <form onSubmit={handleSendCode}>
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemple@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {error && (
                      <div className="space-y-2">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        {errorCode && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-mono text-red-900">
                              <strong>Code d&apos;erreur:</strong> {errorCode}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {success && (
                      <Alert className="border-green-500 bg-green-50 text-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Envoi en cours..." : "Recevoir un code"}
                    </Button>

                    <div className="mt-4 text-center text-xs sm:text-sm">
                      Pas encore de compte ?{" "}
                      <Link href="/auth/sign-up" className="underline underline-offset-4">
                        S&apos;inscrire
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleVerifyCode}>
                <div className="flex flex-col gap-4 sm:gap-6">
                  {devCode && (
                    <Alert className="border-blue-500 bg-blue-50 text-blue-900">
                      <AlertDescription className="text-center">
                        <div className="font-bold text-lg mb-1">Votre code de connexion :</div>
                        <div className="text-3xl font-mono tracking-widest">{devCode}</div>
                        <div className="text-xs mt-2 opacity-75">Mode développement - Le code est affiché ici</div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="code" className="text-sm">
                      Code à 4 chiffres
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      placeholder="1234"
                      required
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading || code.length !== 4}>
                    {isLoading ? "Vérification..." : "Vérifier le code"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setStep("email")
                      setCode("")
                      setError(null)
                      setSuccess(null)
                      setDevCode(null)
                    }}
                  >
                    Retour
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
