import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import DashboardClient from './dashboard-client'

export const metadata: Metadata = {
  title: 'Tableau de bord - Nextudy',
  description: 'Gérez votre compte et votre abonnement Nextudy',
}

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <DashboardClient user={user} />
}
