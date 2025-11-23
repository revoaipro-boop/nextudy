import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  console.log("[v0] ===== VERIFY LOGIN START =====")

  try {
    const { searchParams, origin } = new URL(request.url)
    const token = searchParams.get("token")

    console.log("[v0] Token received:", token ? "Yes" : "No")

    if (!token) {
      console.error("[v0] No token provided")
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_token`)
    }

    const supabase = createAdminClient()

    console.log("[v0] Verifying token in database...")

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from("login_verification_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single()

    if (tokenError || !tokenData) {
      console.error("[v0] Invalid token:", tokenError)
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_token`)
    }

    console.log("[v0] Token valid for user:", tokenData.user_id)

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error("[v0] Token expired")
      return NextResponse.redirect(`${origin}/auth/login?error=expired_token`)
    }

    console.log("[v0] Checking activation status...")

    const { data: activationToken, error: activationError } = await supabase
      .from("activation_tokens")
      .select("used")
      .eq("user_id", tokenData.user_id)
      .single()

    if (activationError || !activationToken || !activationToken.used) {
      console.error("[v0] Account not activated")
      return NextResponse.redirect(`${origin}/auth/login?error=account_pending`)
    }

    console.log("[v0] Account is activated")

    // Mark token as used
    await supabase.from("login_verification_tokens").update({ used: true }).eq("id", tokenData.id)

    console.log("[v0] Updating user profile...")

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("login_count, session_started_at")
      .eq("id", tokenData.user_id)
      .single()

    // Increment login count
    const newLoginCount = (profile?.login_count || 0) + 1
    const sessionStartedAt = profile?.session_started_at || new Date().toISOString()

    await supabase
      .from("profiles")
      .update({
        login_count: newLoginCount,
        last_login_at: new Date().toISOString(),
        session_started_at: sessionStartedAt,
      })
      .eq("id", tokenData.user_id)

    console.log("[v0] Generating session link...")

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
    const redirectUrl = `${appUrl}/auth/session-handler`

    console.log("[v0] App URL:", appUrl)
    console.log("[v0] Redirect URL:", redirectUrl)

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: tokenData.email,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (linkError || !linkData) {
      console.error("[v0] Error generating link:", linkError)
      return NextResponse.redirect(
        `${origin}/auth/login?error=session_error&message=${encodeURIComponent("Impossible de créer la session")}`,
      )
    }

    console.log("[v0] Link generated successfully")
    console.log("[v0] Action link (first 100 chars):", linkData.properties.action_link.substring(0, 100))
    console.log("[v0] Redirect URL in link:", redirectUrl)

    // This allows the browser to handle the redirect to Supabase, which then redirects back with tokens
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Connexion en cours...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .spinner {
              width: 50px;
              height: 50px;
              margin: 0 auto 1.5rem;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h1 {
              color: #333;
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
            }
            p {
              color: #666;
              margin: 0;
              font-size: 0.95rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>Connexion en cours...</h1>
            <p>Vous allez être redirigé automatiquement</p>
          </div>
          <script>
            // Client-side redirect to avoid CORS issues
            console.log('[v0] Redirecting to Supabase magic link...');
            window.location.href = ${JSON.stringify(linkData.properties.action_link)};
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("[v0] ===== FATAL ERROR IN VERIFY LOGIN =====")
    console.error("[v0] Error:", error)
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "No stack")

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=server_error&message=${encodeURIComponent(errorMessage)}`,
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
