import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // Fixed import path from @/lib/supabase-server to @/lib/supabase/server
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() // Added await since createClient is async

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, subject, grade, format, messages } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages to share" }, { status: 400 })
    }

    // Generate unique share token
    const shareToken = nanoid(16)

    // Insert shared chat
    const { data, error } = await supabase
      .from("shared_chats")
      .insert({
        user_id: user.id,
        share_token: shareToken,
        title: title || `${subject} - ${format}`,
        subject,
        grade,
        format,
        messages,
        is_public: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating shared chat:", error)
      return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
    }

    return NextResponse.json({ shareToken, id: data.id })
  } catch (error) {
    console.error("[v0] Share chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
