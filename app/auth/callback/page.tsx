import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { NextRequest } from "next/server"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  if (searchParams.error) {
    redirect(`/auth/login?error=${searchParams.error}`)
  }

  if (searchParams.code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)
    
    if (error) {
      redirect(`/auth/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`)
    }

    // Check if user has approved profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status, role")
        .eq("id", user.id)
        .single()

      // If no profile exists (new OAuth user), create one with pending status
      if (!profile) {
        await supabase.from("profiles").insert({
          id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          verification_status: "pending",
          role: "free",
        })
        
        redirect("/auth/pending-approval")
      }

      // If profile exists but not approved, redirect to pending page
      if (profile.verification_status !== "approved") {
        redirect("/auth/pending-approval")
      }
    }
  }

  redirect("/")
}
