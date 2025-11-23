'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PricingClient() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('[v0] No checkout URL received')
      }
    } catch (error) {
      console.error('[v0] Subscription error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const monthlyPrice = 9.99
  const annualPrice = 99.99
  const annualMonthly = (annualPrice / 12).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Plans et Tarifs
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Choisissez votre plan Nextudy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Commencez gratuitement. Passez à Premium pour débloquer toutes les fonctionnalités et booster votre apprentissage.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center rounded-full bg-muted p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'annual'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annuel
              <span className="ml-2 text-xs text-primary">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                Gratuit
              </CardTitle>
              <CardDescription>Pour découvrir Nextudy</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>5 résumés IA par mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>10 flashcards par mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>5 QCM par mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Chat IA limité (10 messages/jour)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Mode Pomodoro</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Suivi de progression basique</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href={user ? '/dashboard' : '/auth/sign-up'}>
                  {user ? 'Tableau de bord' : 'Commencer gratuitement'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                <Crown className="h-3 w-3 mr-1" />
                Recommandé
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Premium
              </CardTitle>
              <CardDescription>Pour les étudiants sérieux</CardDescription>
              <div className="mt-4">
                {billingInterval === 'monthly' ? (
                  <>
                    <span className="text-4xl font-bold">{monthlyPrice}€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold">{annualMonthly}€</span>
                    <span className="text-muted-foreground">/mois</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      Facturé {annualPrice}€/an
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Résumés IA illimités</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Flashcards illimitées</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">QCM illimités</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Chat IA illimité</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Analyse avancée de documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Statistiques détaillées</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Export PDF de vos résumés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Priorité sur le support</span>
                </li>
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => handleSubscribe(billingInterval)}
                disabled={isLoading}
              >
                {isLoading ? 'Chargement...' : 'Passer à Premium'}
              </Button>
              {billingInterval === 'annual' && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Économisez {((monthlyPrice * 12 - annualPrice)).toFixed(2)}€ par an
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Comparaison détaillée</h2>
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-4 border-b font-medium">
              <div>Fonctionnalité</div>
              <div className="text-center">Gratuit</div>
              <div className="text-center">Premium</div>
            </div>
            {[
              { feature: 'Résumés IA', free: '5/mois', premium: 'Illimité' },
              { feature: 'Flashcards', free: '10/mois', premium: 'Illimité' },
              { feature: 'QCM', free: '5/mois', premium: 'Illimité' },
              { feature: 'Chat IA', free: '10 msg/jour', premium: 'Illimité' },
              { feature: 'Export PDF', free: '—', premium: '✓' },
              { feature: 'Statistiques avancées', free: '—', premium: '✓' },
              { feature: 'Support prioritaire', free: '—', premium: '✓' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0">
                <div>{row.feature}</div>
                <div className="text-center text-muted-foreground">{row.free}</div>
                <div className="text-center font-medium">{row.premium}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Puis-je annuler mon abonnement à tout moment ?',
                a: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Vous conserverez l\'accès Premium jusqu\'à la fin de votre période de facturation.',
              },
              {
                q: 'Que se passe-t-il si je dépasse les limites du plan gratuit ?',
                a: 'Vous serez invité à passer à Premium pour continuer à utiliser les fonctionnalités. Vos données sont conservées et vous pouvez les retrouver en upgrading.',
              },
              {
                q: 'Les prix incluent-ils la TVA ?',
                a: 'Les prix affichés sont TTC (Toutes Taxes Comprises) pour la France.',
              },
              {
                q: 'Y a-t-il une période d\'essai ?',
                a: 'Le plan gratuit vous permet de tester Nextudy sans engagement. Vous pouvez upgrader à Premium à tout moment.',
              },
            ].map((faq, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
