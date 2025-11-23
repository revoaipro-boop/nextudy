"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ActivationErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "Une erreur est survenue"
  const errorId = searchParams.get("errorId")

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-rose-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Erreur</CardTitle>
          <CardDescription className="text-base mt-2">{decodeURIComponent(message)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorId && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-700 font-mono">ID d'erreur : {errorId}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/admin/users">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour liste utilisateurs
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="#" onClick={() => window.history.back()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
