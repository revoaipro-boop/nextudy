import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './analytics-client'

export const metadata: Metadata = {
  title: 'Analytics - Admin',
  description: 'Statistiques détaillées de la plateforme',
}

export default async function AnalyticsPage() {
  const isUserAdmin = await isAdmin()
  
  if (!isUserAdmin) {
    redirect('/')
  }

  const supabase = await createClient()
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: totalUsers },
    { count: newUsers },
    { count: activeSubs },
    { count: totalRevenue }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
  ])

  const analytics = {
    totalUsers: totalUsers || 0,
    newUsersLast30Days: newUsers || 0,
    activeSubscriptions: activeSubs || 0,
    estimatedMRR: (activeSubs || 0) * 9.99,
  }

  return <AnalyticsClient analytics={analytics} />
}
