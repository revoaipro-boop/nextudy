'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, CreditCard, Calendar, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { AuthUser } from '@/lib/auth'
import { useSearchParams } from 'next/navigation'

interface SubscriptionClientProps {
  user: AuthUser
  subscription: any
}

export default function SubscriptionClient({ user, subscription }: SubscriptionClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const isPremium = user.role === 'premium' || user.role === 'admin' || user.subscription_status === 'active'

  const handleManageSubscription = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/portal-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('[v0] Portal session error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Merci pour votre abonnement ! Votre compte Premium est maintenant actif.
            </AlertDescription>
          </Alert>
        )}

        {canceled && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Le paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion de l'abonnement</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement et vos informations de facturation
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPremium ? (
                <>
                  <Crown className="h-5 w-5 text-primary" />
                  Plan Premium
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 text-muted-foreground" />
                  Plan Gratuit
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isPremium 
                ? 'Vous avez accès à toutes les fonctionnalités Premium' 
                : 'Passez à Premium pour débloquer toutes les fonctionnalités'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPremium ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Statut</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription?.status === 'active' ? 'Actif' : subscription?.status}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                </div>

                {subscription?.current_period_end && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Prochaine facturation</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <Button 
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isLoading ? 'Chargement...' : 'Gérer mon abonnement'}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Vous serez redirigé vers le portail de facturation sécurisé Stripe
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Résumés illimités</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Flashcards illimitées</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>QCM illimités</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Chat IA illimité</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Export PDF</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Statistiques avancées</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  asChild
                >
                  <Link href="/pricing">
                    <Crown className="h-4 w-4 mr-2" />
                    Passer à Premium
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités incluses</CardTitle>
            <CardDescription>
              Avec Premium, profitez de tout Nextudy sans limites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="font-medium text-sm">Plan Gratuit</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• 5 résumés/mois</div>
                  <div>• 10 flashcards/mois</div>
                  <div>• 5 QCM/mois</div>
                  <div>• 10 messages chat/jour</div>
                  <div>• Statistiques basiques</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Plan Premium
                </div>
                <div className="space-y-2 text-sm font-medium">
                  <div>• Résumés illimités</div>
                  <div>• Flashcards illimitées</div>
                  <div>• QCM illimités</div>
                  <div>• Chat IA illimité</div>
                  <div>• Statistiques avancées</div>
                  <div>• Export PDF</div>
                  <div>• Support prioritaire</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
