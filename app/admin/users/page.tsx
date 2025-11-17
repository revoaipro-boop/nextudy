import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import UsersManagementClient from './users-management-client'

export const metadata: Metadata = {
  title: 'Gestion des utilisateurs - Admin',
  description: 'Gérez les utilisateurs de la plateforme',
}

export default async function UsersPage() {
  const isUserAdmin = await isAdmin()
  
  if (!isUserAdmin) {
    redirect('/')
  }

  const supabase = await createClient()
  
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (
        status,
        stripe_subscription_id,
        current_period_end
      )
    `)
    .order('created_at', { ascending: false })

  return <UsersManagementClient users={users || []} />
}
