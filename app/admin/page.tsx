import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from './admin-dashboard-client'

export const metadata: Metadata = {
  title: 'Administration - Nextudy',
  description: 'Tableau de bord administrateur Nextudy',
}

export default async function AdminPage() {
  const isUserAdmin = await isAdmin()
  
  if (!isUserAdmin) {
    redirect('/')
  }

  const supabase = await createClient()
  
  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: totalSummaries },
    { count: totalConversations },
    { data: recentUsers }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'premium'),
    supabase.from('summaries').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10)
  ])

  const stats = {
    totalUsers: totalUsers || 0,
    premiumUsers: premiumUsers || 0,
    freeUsers: (totalUsers || 0) - (premiumUsers || 0),
    totalSummaries: totalSummaries || 0,
    totalConversations: totalConversations || 0,
  }

  return <AdminDashboardClient stats={stats} recentUsers={recentUsers || []} />
}
