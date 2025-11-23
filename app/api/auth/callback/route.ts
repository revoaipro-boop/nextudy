import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  const timestamp = new Date().toISOString()
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  console.log("[v0] ===== AUTH CALLBACK START =====")
  console.log("[v0] Timestamp:", timestamp)
  console.log("[v0] IP Address:", ip)
  console.log("[v0] User Agent:", request.headers.get("user-agent"))

  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")

    console.log("[v0] Environment check:")
    console.log("[v0] - NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing")
    console.log(
      "[v0] - NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
    )
    console.log("[v0] - SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing")
    console.log("[v0] - NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "Not set")

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("[v0] FATAL: Missing required environment variables")
      return NextResponse.redirect(
        `${origin}/auth/login?error=missing_env&message=${encodeURIComponent("Configuration serveur incomplète. Contactez l'administrateur.")}`,
      )
    }

    console.log("[v0] Code parameter present:", !!code)
    console.log("[v0] Code length:", code?.length || 0)
    console.log("[v0] Origin:", origin)
    console.log("[v0] Full URL:", request.url)

    if (!code) {
      console.error("[v0] ERROR: No code parameter in callback URL")
      console.error("[v0] All search params:", Object.fromEntries(searchParams.entries()))
      return NextResponse.redirect(
        `${origin}/auth/login?error=missing_code&message=${encodeURIComponent("Aucun code de vérification trouvé dans l'URL")}`,
      )
    }

    const response = NextResponse.redirect(`${origin}`)

    console.log("[v0] Creating Supabase client with ANON_KEY for session exchange...")

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return (
              request.headers
                .get("cookie")
                ?.split("; ")
                .map((cookie) => {
                  const [name, ...rest] = cookie.split("=")
                  return { name, value: rest.join("=") }
                }) ?? []
            )
          },
          setAll(cookiesToSet) {
            console.log("[v0] Setting cookies:", cookiesToSet.map((c) => c.name).join(", "))
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    console.log("[v0] Calling exchangeCodeForSession...")
    const exchangeStart = Date.now()

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    const exchangeDuration = Date.now() - exchangeStart
    console.log("[v0] exchangeCodeForSession completed in", exchangeDuration, "ms")

    if (sessionError) {
      console.error("[v0] ERROR: Failed to exchange code")
      console.error("[v0] Error message:", sessionError.message)
      console.error("[v0] Error name:", sessionError.name)
      console.error("[v0] Error status:", sessionError.status)
      console.error("[v0] Full error object:", JSON.stringify(sessionError, null, 2))
      return NextResponse.redirect(
        `${origin}/auth/login?error=code_exchange_failed&message=${encodeURIComponent(`Échec de l'échange du code: ${sessionError.message}`)}`,
      )
    }

    if (!sessionData?.user) {
      console.error("[v0] ERROR: No user in session data")
      console.error("[v0] Session data:", JSON.stringify(sessionData, null, 2))
      return NextResponse.redirect(
        `${origin}/auth/login?error=no_user_data&message=${encodeURIComponent("Aucune donnée utilisateur dans la session")}`,
      )
    }

    console.log("[v0] SUCCESS: Session created")
    console.log("[v0] User ID:", sessionData.user.id)
    console.log("[v0] User email:", sessionData.user.email)
    console.log("[v0] Session expires at:", sessionData.session?.expires_at)

    console.log("[v0] Creating admin Supabase client with SERVICE_ROLE_KEY...")

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // Admin client doesn't need to set cookies
          },
        },
      },
    )

    console.log("[v0] Checking activation status in activation_tokens table...")
    const activationStart = Date.now()

    const { data: activationToken, error: activationError } = await adminSupabase
      .from("activation_tokens")
      .select("used, created_at, token")
      .eq("user_id", sessionData.user.id)
      .single()

    const activationDuration = Date.now() - activationStart
    console.log("[v0] Activation check completed in", activationDuration, "ms")

    if (activationError) {
      console.error("[v0] ERROR: Failed to check activation")
      console.error("[v0] Error message:", activationError.message)
      console.error("[v0] Error code:", activationError.code)
      console.error("[v0] Error details:", activationError.details)
      console.error("[v0] Error hint:", activationError.hint)
      console.error("[v0] Full error:", JSON.stringify(activationError, null, 2))

      if (activationError.code === "PGRST116") {
        console.error("[v0] No activation token found for user")
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/auth/login?error=account_not_activated&message=${encodeURIComponent("Votre compte n'a pas encore été validé par l'administrateur.")}`,
        )
      }

      return NextResponse.redirect(
        `${origin}/auth/login?error=activation_check_failed&message=${encodeURIComponent(`Impossible de vérifier le statut d'activation: ${activationError.message}`)}`,
      )
    }

    console.log("[v0] Activation token found:")
    console.log("[v0] - used:", activationToken.used)
    console.log("[v0] - created_at:", activationToken.created_at)

    if (!activationToken || activationToken.used !== true) {
      console.error("[v0] ERROR: Account not activated")
      console.error("[v0] Token used status:", activationToken?.used)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${origin}/auth/login?error=account_not_activated&message=${encodeURIComponent("Votre compte n'a pas encore été validé par l'administrateur. Vous recevrez un email une fois votre compte activé.")}`,
      )
    }

    console.log("[v0] SUCCESS: Account is activated")
    console.log("[v0] Redirecting to home page")
    console.log(
      "[v0] Response cookies:",
      response.cookies
        .getAll()
        .map((c) => c.name)
        .join(", "),
    )
    console.log("[v0] ===== AUTH CALLBACK END (SUCCESS) =====")

    return response
  } catch (error) {
    console.error("[v0] ===== FATAL ERROR IN AUTH CALLBACK =====")
    console.error("[v0] Timestamp:", timestamp)
    console.error("[v0] IP:", ip)
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] Full error object:", JSON.stringify(error, null, 2))

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=unknown_error&message=${encodeURIComponent(`Erreur inattendue: ${errorMessage}`)}`,
    )
  }
}
