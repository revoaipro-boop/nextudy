import { NextResponse } from "next/server"
import { sendAdminNotification } from "@/lib/email"
import { generateActivationToken, getTokenHashPrefix } from "@/lib/token"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Notify admin endpoint called")

    const { displayName, userId, email } = await request.json()

    console.log("[v0] Request data:", { displayName, userId, email })

    if (!displayName || !userId || !email) {
      console.error("[v0] Missing required fields")
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("[v0] Generating activation token...")
    const { token, tokenHash } = await generateActivationToken()
    const tokenHashPrefix = getTokenHashPrefix(tokenHash)
    console.log("[v0] Token generated. Hash prefix:", tokenHashPrefix)

    const supabase = createAdminClient()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    console.log("[v0] Storing activation token in database...")
    const { error: dbError } = await supabase.from("activation_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ error: "Erreur lors de la création du token", details: dbError }, { status: 500 })
    }

    console.log("[v0] Token stored successfully. Expires at:", expiresAt.toISOString())

    console.log("[v0] Calling sendAdminNotification with token")
    const result = await sendAdminNotification({
      displayName,
      userId,
      email,
      activationToken: token, // Send plain token in email (will be hashed on validation)
    })

    console.log("[v0] sendAdminNotification result:", result)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Erreur lors de l'envoi de la notification" }, { status: 500 })
    }

    console.log("[v0] Activation token created:", {
      userId,
      tokenHashPrefix,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ message: "Notification envoyée", data: result.data })
  } catch (error) {
    console.error("[v0] Error in notify-admin:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
