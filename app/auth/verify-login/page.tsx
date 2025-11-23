"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function VerifyLoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setTimeout(() => router.push("/auth/login?error=invalid_token"), 2000)
      return
    }

    // The actual verification happens in the API route
    // This page is just for showing loading state
    fetch(`/api/auth/verify-login?token=${token}`)
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url
        } else if (response.ok) {
          setStatus("success")
          setTimeout(() => router.push("/"), 1000)
        } else {
          setStatus("error")
          setTimeout(() => router.push("/auth/login?error=verification_failed"), 2000)
        }
      })
      .catch(() => {
        setStatus("error")
        setTimeout(() => router.push("/auth/login?error=server_error"), 2000)
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Vérification</CardTitle>
            <CardDescription>
              {status === "verifying" && "Vérification de votre identité en cours..."}
              {status === "success" && "Connexion réussie !"}
              {status === "error" && "Erreur de vérification"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            {status === "verifying" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === "success" && <p className="text-green-600">Redirection en cours...</p>}
            {status === "error" && <p className="text-destructive">Redirection vers la page de connexion...</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
