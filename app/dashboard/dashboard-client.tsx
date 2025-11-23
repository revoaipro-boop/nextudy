'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Crown, FileText, MessageSquare, Zap, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { AuthUser } from '@/lib/auth'

interface DashboardClientProps {
  user: AuthUser
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const isPremium = user.role === 'premium' || user.role === 'admin' || user.subscription_status === 'active'

  const usageData = {
    summaries: { current: 3, limit: isPremium ? -1 : 5 },
    flashcards: { current: 7, limit: isPremium ? -1 : 10 },
    qcm: { current: 2, limit: isPremium ? -1 : 5 },
    chatMessages: { current: 45, limit: isPremium ? -1 : 10 },
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0
    return (current / limit) * 100
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <Badge variant={isPremium ? 'default' : 'secondary'} className={isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}>
              {isPremium ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Gratuit
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Bienvenue, {user.display_name || user.email}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Résumés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {usageData.summaries.current}
                {usageData.summaries.limit !== -1 && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{usageData.summaries.limit}
                  </span>
                )}
              </div>
              {usageData.summaries.limit !== -1 && (
                <Progress value={getUsagePercentage(usageData.summaries.current, usageData.summaries.limit)} className="h-2" />
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {usageData.flashcards.current}
                {usageData.flashcards.limit !== -1 && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{usageData.flashcards.limit}
                  </span>
                )}
              </div>
              {usageData.flashcards.limit !== -1 && (
                <Progress value={getUsagePercentage(usageData.flashcards.current, usageData.flashcards.limit)} className="h-2" />
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                QCM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {usageData.qcm.current}
                {usageData.qcm.limit !== -1 && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{usageData.qcm.limit}
                  </span>
                )}
              </div>
              {usageData.qcm.limit !== -1 && (
                <Progress value={getUsagePercentage(usageData.qcm.current, usageData.qcm.limit)} className="h-2" />
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Messages Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {usageData.chatMessages.current}
                {usageData.chatMessages.limit !== -1 && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{usageData.chatMessages.limit}/jour
                  </span>
                )}
              </div>
              {usageData.chatMessages.limit !== -1 && (
                <Progress value={getUsagePercentage(usageData.chatMessages.current, usageData.chatMessages.limit)} className="h-2" />
              )}
            </CardContent>
          </Card>
        </div>

        {!isPremium && (
          <Card className="mb-8 border-2 border-primary bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Passez à Premium
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Débloquez toutes les fonctionnalités et supprimez les limites
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
                  <Link href="/pricing">
                    Voir les plans
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nom d'affichage</div>
                <div className="font-medium">{user.display_name || 'Non défini'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Statut</div>
                <div className="flex items-center gap-2">
                  <Badge variant={isPremium ? 'default' : 'secondary'}>
                    {isPremium ? 'Premium' : 'Gratuit'}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/settings">
                  Modifier le profil
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPremium ? (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Plan actuel</div>
                    <div className="font-medium">Premium</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Statut</div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Actif
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/subscription">
                      Gérer l'abonnement
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Vous utilisez actuellement le plan gratuit. Passez à Premium pour débloquer toutes les fonctionnalités.
                  </p>
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
                      <span>Chat IA illimité</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
                    <Link href="/pricing">
                      Passer à Premium
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activité récente
              </CardTitle>
              <CardDescription>
                Vos dernières actions sur Nextudy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Résumé créé</div>
                    <div className="text-sm text-muted-foreground">Il y a 2 heures</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Flashcards générées</div>
                    <div className="text-sm text-muted-foreground">Hier</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Session Chat IA</div>
                    <div className="text-sm text-muted-foreground">Il y a 3 jours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
