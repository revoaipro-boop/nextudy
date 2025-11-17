import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Inscription réussie !</CardTitle>
            <CardDescription>Votre compte est en attente de validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Merci de votre inscription ! Votre compte a été créé et est en attente de validation par un
              administrateur.
            </p>
            <p className="text-sm text-muted-foreground">
              Vous recevrez une notification par email une fois votre compte approuvé. Vous pourrez alors vous
              connecter.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
