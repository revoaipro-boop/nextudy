import { isAdmin } from "@/lib/auth"
import { redirect } from 'next/navigation'

interface RequireAdminProps {
  children: React.ReactNode
}

export async function RequireAdmin({ children }: RequireAdminProps) {
  const isUserAdmin = await isAdmin()
  
  if (!isUserAdmin) {
    redirect("/")
  }

  return <>{children}</>
}
