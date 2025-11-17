import { hasPremiumAccess } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lock } from 'lucide-react'

interface RequirePremiumProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function RequirePremium({ children, fallback }: RequirePremiumProps) {
  const hasAccess = await hasPremiumAccess()
  
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Accès Premium Requis</CardTitle>
            </div>
            <CardDescription>
              Cette fonctionnalité est réservée aux membres premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Débloquez toutes les fonctionnalités de Nextudy avec un abonnement premium.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/pricing">Voir les tarifs</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Retour à l&apos;accueil</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
