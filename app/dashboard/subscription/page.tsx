import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import SubscriptionClient from './subscription-client'

export const metadata: Metadata = {
  title: "Gestion de l'abonnement - Nextudy",
  description: 'Gérez votre abonnement Premium Nextudy',
}

export default async function SubscriptionPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <SubscriptionClient user={user} subscription={subscription} />
}
