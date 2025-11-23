"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ActivationSuccessPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "Opération réussie"
  const userName = searchParams.get("userName")
  const action = searchParams.get("action")

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Succès</CardTitle>
          <CardDescription className="text-base mt-2">{decodeURIComponent(message)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userName && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Utilisateur :</span> {userName}
              </p>
              {action && (
                <p className="text-sm text-green-800 mt-1">
                  <span className="font-semibold">Action :</span> {action === "approve" ? "Approuvé" : "Rejeté"}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/admin/users">Retour liste utilisateurs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
