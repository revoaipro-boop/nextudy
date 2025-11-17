import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock } from 'lucide-react'
import Link from "next/link"

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Compte en attente de validation</CardTitle>
          <CardDescription>
            Votre inscription a bien été prise en compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Votre compte doit être validé par un administrateur avant de pouvoir accéder à la plateforme.
              Vous recevrez un email de confirmation une fois votre compte activé.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>En attendant, voici ce qui va se passer :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Un administrateur va examiner votre demande</li>
              <li>Vous recevrez un email une fois votre compte approuvé</li>
              <li>Vous pourrez alors accéder à toutes les fonctionnalités</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild variant="outline">
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
