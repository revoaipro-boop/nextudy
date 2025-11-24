import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.log("[v0] Auth token refresh failed, clearing cookies:", error)
    const authCookies = request.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("auth-token"))
    authCookies.forEach((cookie) => {
      supabaseResponse.cookies.delete(cookie.name)
    })
  }

  if (user) {
    const { data: activationToken } = await supabase
      .from("activation_tokens")
      .select("used")
      .eq("user_id", user.id)
      .single()

    // If no activation token or not used, redirect to login with error
    if (!activationToken || !activationToken.used) {
      console.log("[v0] User not activated, signing out")
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "account_not_activated")
      return NextResponse.redirect(url)
    }

    // Also check profile verification status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified, verification_status")
      .eq("id", user.id)
      .single()

    if (profile && profile.verification_status !== "approved") {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "account_pending")
      return NextResponse.redirect(url)
    }
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    (request.nextUrl.pathname.startsWith("/profile") || request.nextUrl.pathname.startsWith("/todos"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (
    user &&
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/sign-up"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
