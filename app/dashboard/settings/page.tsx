import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import SettingsClient from './settings-client'

export const metadata: Metadata = {
  title: 'Paramètres - Nextudy',
  description: 'Gérez vos paramètres de compte Nextudy',
}

export default async function SettingsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <SettingsClient user={user} />
}
