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

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Connexion</CardTitle>
            <CardDescription className="text-sm">
              {step === "email"
                ? "Entrez votre email pour recevoir un code de vérification"
                : "Entrez le code à 4 chiffres envoyé par email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
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
