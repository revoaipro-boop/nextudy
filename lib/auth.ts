import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { cache } from "react"

export type UserRole = "free" | "premium" | "admin"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  subscription_status: "inactive" | "active" | "cancelled" | "past_due"
  display_name?: string
  avatar_url?: string
}

export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Fetch profile with role and subscription info
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status, display_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return null
  }

  return {
    id: user.id,
    email: user.email || "",
    role: (profile.role as UserRole) || "free",
    subscription_status: profile.subscription_status || "inactive",
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  }
})

export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  return user?.role === "admin"
}

export async function hasPremiumAccess(): Promise<boolean> {
  const user = await getUser()
  return user?.role === "premium" || user?.role === "admin" || user?.subscription_status === "active"
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw new Error("Forbidden - Admin access required")
  }
  return user
}

export async function requirePremium(): Promise<AuthUser> {
  const user = await requireAuth()
  const hasAccess = await hasPremiumAccess()
  if (!hasAccess) {
    throw new Error("Forbidden - Premium access required")
  }
  return user
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  await requireAdmin()
  
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }
}
