import { getUser } from "@/lib/auth"
import { redirect } from 'next/navigation'

interface RequireAuthProps {
  children: React.ReactNode
}

export async function RequireAuth({ children }: RequireAuthProps) {
  const user = await getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  return <>{children}</>
}
