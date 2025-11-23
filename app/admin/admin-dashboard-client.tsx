'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Crown, FileText, MessageSquare, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number
    premiumUsers: number
    freeUsers: number
    totalSummaries: number
    totalConversations: number
  }
  recentUsers: any[]
}

export default function AdminDashboardClient({ stats, recentUsers }: AdminDashboardClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Administration</h1>
            <Badge variant="destructive">
              <Crown className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Vue d'ensemble et gestion de la plateforme
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.freeUsers} gratuits, {stats.premiumUsers} premium
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Abonnements Premium
              </CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premiumUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}% de conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Résumés Générés
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSummaries}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats.totalSummaries / stats.totalUsers).toFixed(1)} par utilisateur
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Conversations IA
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats.totalConversations / stats.totalUsers).toFixed(1)} par utilisateur
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actions rapides
              </CardTitle>
              <CardDescription>
                Gérez la plateforme rapidement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les utilisateurs
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Voir les statistiques détaillées
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs récents</CardTitle>
              <CardDescription>
                Dernières inscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {user.display_name || 'Sans nom'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Badge variant={user.role === 'premium' ? 'default' : 'secondary'}>
                      {user.role || 'free'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
