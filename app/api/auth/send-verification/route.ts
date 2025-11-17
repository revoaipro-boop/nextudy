import "server-only"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendLoginVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if user exists and get their profile
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("[v0] Error fetching users:", authError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    const user = authData.users.find((u) => u.email === email)

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "Si un compte existe avec cet email, un lien de vérification a été envoyé.",
      })
    }

    const { data: activationToken, error: activationError } = await supabase
      .from("activation_tokens")
      .select("used")
      .eq("user_id", user.id)
      .single()

    if (activationError || !activationToken) {
      console.error("[v0] Error checking activation token:", activationError)
      return NextResponse.json(
        {
          error: "Votre compte est en attente de validation par l'administrateur.",
        },
        { status: 403 },
      )
    }

    if (!activationToken.used) {
      return NextResponse.json(
        {
          error: "Votre compte est en attente de validation par l'administrateur.",
        },
        { status: 403 },
      )
    }

    // Check user verification status in profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified, verification_status, display_name, login_count")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 })
    }

    // Check if session should be expired (after 2 logins)
    if (profile.login_count >= 2) {
      // Reset login count to allow new session
      await supabase.from("profiles").update({ login_count: 0, session_started_at: null }).eq("id", user.id)
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store token in database
    const { error: tokenError } = await supabase.from("login_verification_tokens").insert({
      user_id: user.id,
      token,
      email,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error("[v0] Error storing token:", tokenError)
      return NextResponse.json({ error: "Erreur lors de la création du lien" }, { status: 500 })
    }

    // Send verification email
    const emailResult = await sendLoginVerificationEmail({
      email,
      token,
      displayName: profile.display_name || "Utilisateur",
    })

    if (!emailResult.success) {
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Un lien de vérification a été envoyé à votre adresse email.",
    })
  } catch (error) {
    console.error("[v0] Error in send-verification:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
