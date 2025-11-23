import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { verifyActivationToken, getTokenHashPrefix } from "@/lib/token"

export async function GET(request: NextRequest) {
  const errorId = randomUUID()
  const timestamp = new Date().toISOString()
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  console.log("[v0] 🔧 ========================================")
  console.log("[v0] 🔧 Admin validation endpoint called")
  console.log("[v0] 🔧 Error ID:", errorId)
  console.log("[v0] 🔧 Timestamp:", timestamp)
  console.log("[v0] 🔧 Client IP:", clientIp)
  console.log("[v0] 🔧 ========================================")

  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")
  const userId = searchParams.get("userId")
  const action = searchParams.get("action")

  console.log("[v0] 📋 URL Parameters received:")
  console.log("[v0]   - token:", token ? `${token.substring(0, 12)}... (length: ${token.length})` : "MISSING")
  console.log("[v0]   - userId:", userId || "NOT PROVIDED")
  console.log("[v0]   - action:", action || "MISSING")
  console.log("[v0] 📋 Full URL:", request.url)

  if (!token) {
    console.error("[v0] ❌ Token parameter is missing from URL")
    return NextResponse.redirect(
      new URL(
        `/admin/activation-error?message=${encodeURIComponent("Lien invalide : token manquant")}&errorId=${errorId}`,
        request.url,
      ),
    )
  }

  if (!action) {
    console.error("[v0] ❌ Action parameter is missing from URL")
    return NextResponse.redirect(
      new URL(
        `/admin/activation-error?message=${encodeURIComponent("Lien invalide : action manquante")}&errorId=${errorId}`,
        request.url,
      ),
    )
  }

  if (action !== "approve" && action !== "reject") {
    console.error("[v0] ❌ Invalid action value:", action)
    return NextResponse.redirect(
      new URL(
        `/admin/activation-error?message=${encodeURIComponent("Action invalide")}&errorId=${errorId}`,
        request.url,
      ),
    )
  }

  try {
    console.log("[v0] 🔌 Creating Supabase admin client...")
    const supabase = createAdminClient()
    console.log("[v0] ✓ Admin client created successfully")

    console.log("[v0] 🔍 Fetching activation tokens from database...")
    console.log("[v0]   - Filtering: used = false")
    console.log("[v0]   - Filtering: expires_at > NOW()")

    const now = new Date().toISOString()
    const { data: tokens, error: fetchError } = await supabase
      .from("activation_tokens")
      .select("*")
      .eq("used", false)
      .gt("expires_at", now)

    if (fetchError) {
      console.error("[v0] ❌ Database error while fetching tokens:", fetchError)
      return NextResponse.redirect(
        new URL(
          `/admin/activation-error?message=${encodeURIComponent("Erreur base de données")}&errorId=${errorId}`,
          request.url,
        ),
      )
    }

    console.log("[v0] 📊 Database query results:")
    console.log("[v0]   - Tokens found:", tokens?.length || 0)
    if (tokens && tokens.length > 0) {
      tokens.forEach((t, index) => {
        console.log(`[v0]   - Token ${index + 1}:`)
        console.log(`[v0]     * user_id: ${t.user_id}`)
        console.log(`[v0]     * token_hash prefix: ${getTokenHashPrefix(t.token_hash)}`)
        console.log(`[v0]     * expires_at: ${t.expires_at}`)
        console.log(`[v0]     * used: ${t.used}`)
        console.log(`[v0]     * created_at: ${t.created_at}`)
      })
    } else {
      console.log("[v0]   - No valid tokens found in database")
    }

    let matchedToken = null
    if (tokens && tokens.length > 0) {
      console.log("[v0] 🔐 Starting token verification...")
      console.log("[v0]   - Token to verify (first 12 chars):", token.substring(0, 12) + "...")

      for (let i = 0; i < tokens.length; i++) {
        const dbToken = tokens[i]
        console.log(`[v0]   - Comparing with token ${i + 1}/${tokens.length}...`)
        console.log(`[v0]     * Hash prefix: ${getTokenHashPrefix(dbToken.token_hash)}`)

        const isValid = await verifyActivationToken(token, dbToken.token_hash)
        console.log(`[v0]     * Verification result: ${isValid ? "✓ MATCH" : "✗ NO MATCH"}`)

        if (isValid) {
          matchedToken = dbToken
          console.log("[v0] ✓✓✓ TOKEN MATCHED! ✓✓✓")
          console.log("[v0]   - Matched user_id:", dbToken.user_id)
          break
        }
      }
    }

    if (!matchedToken) {
      // Check if there are any tokens at all for debugging
      const { data: allTokens } = await supabase
        .from("activation_tokens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      console.error("[v0] ❌ No matching token found")
      console.log("[v0] 🔍 Debug info - Recent tokens in database:")
      if (allTokens && allTokens.length > 0) {
        allTokens.forEach((t, index) => {
          console.log(`[v0]   - Token ${index + 1}:`)
          console.log(`[v0]     * user_id: ${t.user_id}`)
          console.log(`[v0]     * used: ${t.used}`)
          console.log(`[v0]     * expires_at: ${t.expires_at}`)
          console.log(`[v0]     * expired: ${new Date(t.expires_at) < new Date()}`)
        })
      } else {
        console.log("[v0]   - No tokens found in database at all")
      }

      // Determine specific error message
      let errorMessage = "Lien invalide"
      if (allTokens && allTokens.length > 0) {
        const hasExpired = allTokens.some((t) => new Date(t.expires_at) < new Date())
        const hasUsed = allTokens.some((t) => t.used === true)

        if (hasUsed) {
          errorMessage = "Ce lien a déjà été utilisé"
        } else if (hasExpired) {
          errorMessage = "Lien expiré (valide 24h)"
        } else {
          errorMessage = "Token invalide ou corrompu"
        }
      }

      return NextResponse.redirect(
        new URL(`/admin/activation-error?message=${encodeURIComponent(errorMessage)}&errorId=${errorId}`, request.url),
      )
    }

    const matchedUserId = matchedToken.user_id
    const tokenHashPrefix = getTokenHashPrefix(matchedToken.token_hash)

    console.log("[v0] ✓ Token validated successfully:")
    console.log("[v0]   - user_id:", matchedUserId)
    console.log("[v0]   - token_hash prefix:", tokenHashPrefix)
    console.log("[v0]   - expires_at:", matchedToken.expires_at)

    console.log("[v0] 🔍 Fetching user profile...", { userId: matchedUserId, errorId })
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, verification_status, is_verified")
      .eq("id", matchedUserId)
      .single()

    if (profileError || !profile) {
      console.error("[v0] ❌ User not found:", { userId: matchedUserId, profileError, errorId })
      return NextResponse.redirect(
        new URL(
          `/admin/activation-error?message=${encodeURIComponent("Utilisateur introuvable")}&errorId=${errorId}`,
          request.url,
        ),
      )
    }

    console.log("[v0] ✓ User found:")
    console.log("[v0]   - display_name:", profile.display_name)
    console.log("[v0]   - current verification_status:", profile.verification_status)
    console.log("[v0]   - current is_verified:", profile.is_verified)

    const updates: {
      verification_status: string
      is_verified: boolean
      updated_at: string
    } = {
      verification_status: action === "approve" ? "approved" : "rejected",
      is_verified: action === "approve",
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] 💾 Updating user status to:", updates.verification_status)

    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", matchedUserId)

    if (updateError) {
      console.error("[v0] ❌ Failed to update user profile:", updateError)
      return NextResponse.redirect(
        new URL(
          `/admin/activation-error?message=${encodeURIComponent("Erreur lors de la mise à jour")}&errorId=${errorId}`,
          request.url,
        ),
      )
    }

    console.log("[v0] ✓ User profile updated successfully")

    console.log("[v0] 🔒 Marking token as used...")
    const { error: tokenUpdateError } = await supabase
      .from("activation_tokens")
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", matchedToken.id)

    if (tokenUpdateError) {
      console.error("[v0] ⚠️ Failed to mark token as used (user was updated):", tokenUpdateError)
    } else {
      console.log("[v0] ✓ Token marked as used")
    }

    console.log("[v0] ✅ ========================================")
    console.log("[v0] ✅ VALIDATION SUCCESSFUL")
    console.log("[v0] ✅ User:", profile.display_name)
    console.log("[v0] ✅ Action:", action)
    console.log("[v0] ✅ ========================================")

    const successMessage = action === "approve" ? "Utilisateur activé avec succès" : "Utilisateur rejeté avec succès"

    const successUrl = new URL("/admin/activation-success", request.url)
    successUrl.searchParams.set("message", successMessage)
    successUrl.searchParams.set("userName", profile.display_name || "Utilisateur")
    successUrl.searchParams.set("action", action)

    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error("[v0] ❌ ========================================")
    console.error("[v0] ❌ FATAL ERROR in validate-user")
    console.error("[v0] ❌ Error type:", error?.constructor?.name)
    console.error("[v0] ❌ Error message:", error instanceof Error ? error.message : "Unknown")
    console.error("[v0] ❌ Error stack:", error instanceof Error ? error.stack : "No stack")
    console.error("[v0] ❌ ========================================")

    return NextResponse.redirect(
      new URL(
        `/admin/activation-error?message=${encodeURIComponent("Erreur interne du serveur")}&errorId=${errorId}`,
        request.url,
      ),
    )
  }
}
