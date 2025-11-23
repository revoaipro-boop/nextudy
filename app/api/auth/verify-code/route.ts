import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      console.error("[v0] Missing email or code")
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: loginCode, error: codeError } = await supabase
      .from("login_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .single()

    if (codeError || !loginCode) {
      console.error("[v0] Code not found or error:", codeError)
      return NextResponse.json({ error: "Code incorrect ou expiré" }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(loginCode.expires_at)

    if (now > expiresAt) {
      await supabase.from("login_codes").update({ used: true }).eq("id", loginCode.id)
      console.error("[v0] Code expired for:", email)
      return NextResponse.json({ error: "Code expiré. Veuillez demander un nouveau code." }, { status: 400 })
    }

    const { error: updateError } = await supabase.from("login_codes").update({ used: true }).eq("id", loginCode.id)

    if (updateError) {
      console.error("[v0] Error marking code as used:", updateError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("[v0] Error fetching users:", authError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    let user = authData.users.find((u) => u.email === email)

    if (!user) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      })

      if (createError || !newUser.user) {
        console.error("[v0] Error creating user:", createError)
        return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 })
      }

      user = newUser.user
      console.log("[v0] Created new user:", email)
    }

    const tempPassword = Math.random().toString(36).slice(-20)

    // Update user password
    const { error: passwordError } = await supabase.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    })

    if (passwordError) {
      console.error("[v0] Error setting temp password:", passwordError)
      return NextResponse.json({ error: "Erreur lors de la connexion" }, { status: 500 })
    }

    // Create a client-side supabase instance to sign in
    const { createClient } = await import("@supabase/supabase-js")
    const clientSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Sign in with the temp password to get valid JWT tokens
    const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    })

    if (signInError || !signInData.session) {
      console.error("[v0] Error signing in:", signInError)
      return NextResponse.json({ error: "Erreur lors de la connexion" }, { status: 500 })
    }

    const { data: profile } = await supabase.from("profiles").select("login_count").eq("id", user.id).single()

    if (profile) {
      const newLoginCount = (profile.login_count || 0) + 1
      await supabase
        .from("profiles")
        .update({
          login_count: newLoginCount,
          session_started_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    }

    console.log("[v0] Code verified successfully for:", email)

    return NextResponse.json({
      success: true,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      message: "Code vérifié, connexion en cours...",
    })
  } catch (error) {
    console.error("[v0] Error in verify-code:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
