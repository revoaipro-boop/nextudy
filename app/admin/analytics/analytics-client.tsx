'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

interface AnalyticsClientProps {
  analytics: {
    totalUsers: number
    newUsersLast30Days: number
    activeSubscriptions: number
    estimatedMRR: number
  }
}

export default function AnalyticsClient({ analytics }: AnalyticsClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Statistiques détaillées</h1>
          <p className="text-muted-foreground">
            Analysez les performances de la plateforme
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Total Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Base utilisateur complète
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Nouveaux (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.newUsersLast30Days}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Croissance mensuelle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Abonnements actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Premium subscribers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                MRR Estimé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.estimatedMRR.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenu mensuel récurrent
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Taux de conversion</CardTitle>
              <CardDescription>
                Conversion de gratuit vers premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {((analytics.activeSubscriptions / analytics.totalUsers) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.activeSubscriptions} utilisateurs premium sur {analytics.totalUsers} au total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Croissance</CardTitle>
              <CardDescription>
                Nouveaux utilisateurs sur 30 jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                +{analytics.newUsersLast30Days}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Moyenne de {(analytics.newUsersLast30Days / 30).toFixed(1)} nouveaux utilisateurs par jour
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
