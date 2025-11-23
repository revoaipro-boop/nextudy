"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function SessionHandlerPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"initializing" | "success" | "error">("initializing")
  const [errorMessage, setErrorMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    console.log("[v0]", message)
    setDebugInfo((prev) => [...prev, message])
  }

  useEffect(() => {
    const supabase = createClient()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state changed:", event)
      if (event === "SIGNED_IN" && session) {
        addDebug(`✅ SIGNED_IN event detected: ${session.user.email}`)
        setStatus("success")
        setTimeout(() => {
          addDebug("Redirecting to homepage...")
          window.location.href = "/"
        }, 1000)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    const initializeSession = async () => {
      try {
        addDebug("=== SESSION HANDLER START ===")
        addDebug(`Current URL: ${window.location.href}`)
        addDebug(`Hash: ${window.location.hash}`)

        const supabase = createClient()

        // Check for existing session first
        addDebug("Checking for existing session...")
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession()

        if (existingSession) {
          addDebug(`✅ User already logged in: ${existingSession.user.email}`)
          setStatus("success")
          setTimeout(() => router.push("/"), 1000)
          return
        }

        addDebug("Waiting 500ms for tokens to appear in URL...")
        await new Promise((resolve) => setTimeout(resolve, 500))

        addDebug("Extracting tokens from URL hash...")

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        addDebug(`Access token: ${accessToken ? "✓ Found (" + accessToken.substring(0, 20) + "...)" : "✗ Not found"}`)
        addDebug(
          `Refresh token: ${refreshToken ? "✓ Found (" + refreshToken.substring(0, 20) + "...)" : "✗ Not found"}`,
        )

        if (accessToken && refreshToken) {
          addDebug("Both tokens found, creating session...")

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            addDebug(`❌ Error setting session: ${error.message}`)
            console.error("[v0] Session error details:", error)
            setErrorMessage(`Erreur lors de la création de la session: ${error.message}`)
            setStatus("error")
            return
          }

          if (!data.user) {
            addDebug("❌ No user data in session response")
            setErrorMessage("Aucune donnée utilisateur trouvée après la création de la session")
            setStatus("error")
            return
          }

          addDebug(`✅ Session created successfully!`)
          addDebug(`User ID: ${data.user.id}`)
          addDebug(`User email: ${data.user.email}`)

          const cleanUrl = window.location.pathname
          window.history.replaceState(null, "", cleanUrl)
          addDebug("URL cleaned (tokens removed from history)")

          // Status will be set to success by onAuthStateChange listener
        } else {
          addDebug("⚠️ No tokens found in URL hash")
          setErrorMessage(
            "Aucun token de session trouvé dans l'URL. Le lien de connexion est peut-être expiré ou invalide.",
          )
          setStatus("error")
        }
      } catch (error) {
        addDebug(`❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`)
        console.error("[v0] Fatal error in session handler:", error)
        setErrorMessage(
          error instanceof Error
            ? `Erreur inattendue: ${error.message}`
            : "Erreur inconnue lors de la création de la session",
        )
        setStatus("error")
      }
    }

    initializeSession()
  }, [router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Connexion en cours</CardTitle>
            <CardDescription>
              {status === "initializing" && "Initialisation de votre session..."}
              {status === "success" && "Connexion réussie !"}
              {status === "error" && "Erreur de connexion"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {status === "initializing" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === "success" && (
              <div className="text-center">
                <p className="text-green-600 font-medium text-lg">✓ Vous êtes maintenant connecté</p>
                <p className="text-sm text-muted-foreground mt-2">Redirection vers la page d'accueil...</p>
              </div>
            )}
            {status === "error" && (
              <div className="text-center space-y-4 w-full">
                <p className="text-destructive font-medium text-lg">✗ Échec de la connexion</p>
                {errorMessage && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
                    <p className="text-sm text-destructive font-medium mb-2">Détails de l'erreur :</p>
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-900 font-medium mb-2">💡 Que faire ?</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Retournez à la page de connexion</li>
                    <li>Demandez un nouveau code de vérification</li>
                    <li>Vérifiez que vous utilisez le code le plus récent</li>
                  </ul>
                </div>
                <button onClick={() => router.push("/auth/login")} className="text-sm text-primary hover:underline">
                  Retour à la connexion
                </button>
              </div>
            )}

            {debugInfo.length > 0 && (
              <details className="w-full mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground font-medium">
                  📋 Informations de débogage ({debugInfo.length} entrées)
                </summary>
                <div className="mt-2 bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-left">{debugInfo.join("\n")}</pre>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
