import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const isDev = process.env.NODE_ENV === "development" || !process.env.SMTP_HOST

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("[v0] Error fetching users:", authError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    const user = authData.users.find((u) => u.email === email)

    if (!user) {
      // In production, don't reveal if email exists or not (security)
      if (!isDev) {
        return NextResponse.json(
          {
            error: "Aucun compte n'existe avec cet email. Veuillez vous inscrire avant de vous connecter.",
          },
          { status: 404 },
        )
      }
      // In dev mode, allow non-existent users to still get codes for testing
      return NextResponse.json(
        {
          error: "Aucun compte trouvé. En mode développement, créez d'abord un compte.",
        },
        { status: 404 },
      )
    }

    if (user) {
      const { data: activationToken, error: activationError } = await supabase
        .from("activation_tokens")
        .select("used")
        .eq("user_id", user.id)
        .single()

      if (activationError || !activationToken) {
        console.error("[v0] Error checking activation token:", activationError)
        if (!isDev) {
          return NextResponse.json(
            {
              error: "Votre compte est en attente de validation par l'administrateur.",
            },
            { status: 403 },
          )
        }
      } else if (!activationToken.used && !isDev) {
        return NextResponse.json(
          {
            error: "Votre compte est en attente de validation par l'administrateur.",
          },
          { status: 403 },
        )
      }
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified, verification_status, display_name, login_count")
        .eq("id", user.id)
        .single()

      if (profile && profile.login_count >= 2) {
        await supabase.from("profiles").update({ login_count: 0, session_started_at: null }).eq("id", user.id)
      }
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    console.log("[v0] Generated code for", email, ":", code)

    // Invalidate any existing unused codes for this email
    await supabase.from("login_codes").update({ used: true }).eq("email", email).eq("used", false)

    // Store code in database
    const { error: codeError } = await supabase.from("login_codes").insert({
      email,
      code,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (codeError) {
      console.error("[v0] Error storing code:", codeError)
      return NextResponse.json({ error: "Erreur lors de la création du code" }, { status: 500 })
    }

    if (isDev) {
      console.log("[v0] DEV MODE: Code is", code)
      return NextResponse.json({
        message: "Mode développement : votre code est affiché ci-dessous",
        devCode: code,
        isDev: true,
      })
    }

    const { sendLoginCodeEmail } = await import("@/lib/email")
    const profile = user ? await supabase.from("profiles").select("display_name").eq("id", user.id).single() : null

    const emailResult = await sendLoginCodeEmail({
      email,
      code,
      displayName: profile?.data?.display_name || "Utilisateur",
    })

    if (!emailResult.success) {
      console.error("[v0] Error sending email:", emailResult.error)
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Un code de vérification à 4 chiffres a été envoyé à votre adresse email.",
    })
  } catch (error) {
    console.error("[v0] Error in send-code:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
