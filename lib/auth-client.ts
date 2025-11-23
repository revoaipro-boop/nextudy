"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/auth"

interface ClientAuthUser {
  id: string
  email: string
  role: UserRole
  subscription_status: "inactive" | "active" | "cancelled" | "past_due"
  display_name?: string
  avatar_url?: string
}

export function useAuth() {
  const [user, setUser] = useState<ClientAuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          setUser(null)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, subscription_status, display_name, avatar_url")
          .eq("id", authUser.id)
          .single()

        if (profile) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            role: (profile.role as UserRole) || "free",
            subscription_status: profile.subscription_status || "inactive",
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, isAuthenticated: !!user }
}

export function useRequireAuth() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth/login"
    }
  }, [user, loading])

  return { user, loading }
}

export function useHasPremium() {
  const { user } = useAuth()
  return user?.role === "premium" || user?.role === "admin" || user?.subscription_status === "active"
}

export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === "admin"
}
