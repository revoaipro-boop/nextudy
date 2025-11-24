import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all conversations for user, sorted by most recent
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        id,
        title,
        subject,
        grade,
        format,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching conversations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For each conversation, get the messages
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("timestamp", { ascending: true })

        return {
          id: conv.id,
          title: conv.title,
          subject: conv.subject,
          grade: conv.grade,
          format: conv.format,
          messages: (messages || []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources,
            timestamp: new Date(m.timestamp).getTime(),
          })),
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithMessages })
  } catch (error) {
    console.error("[v0] Error in conversations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, subject, grade, format, messages } = await request.json()

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
        subject,
        grade,
        format,
      })
      .select()
      .single()

    if (convError) {
      console.error("[v0] Error creating conversation:", convError)
      return NextResponse.json({ error: convError.message }, { status: 500 })
    }

    // Insert messages if provided
    if (messages && messages.length > 0) {
      const messagesToInsert = messages.map((m: any) => ({
        conversation_id: conversation.id,
        role: m.role,
        content: m.content,
        sources: m.sources || null,
        timestamp: new Date(m.timestamp || Date.now()),
      }))

      const { error: msgError } = await supabase
        .from("conversation_messages")
        .insert(messagesToInsert)

      if (msgError) {
        console.error("[v0] Error inserting messages:", msgError)
      }
    }

    return NextResponse.json({ conversationId: conversation.id })
  } catch (error) {
    console.error("[v0] Error in POST conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
