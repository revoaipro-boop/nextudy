import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("short_id", id)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data: messages, error: msgError } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("timestamp", { ascending: true })

    if (msgError) {
      console.error("[v0] Error fetching messages:", msgError)
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: conversation.short_id,
      title: conversation.title,
      subject: conversation.subject,
      grade: conversation.grade,
      format: conversation.format,
      messages: (messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        timestamp: new Date(m.timestamp).getTime(),
      })),
      createdAt: new Date(conversation.created_at).getTime(),
      updatedAt: new Date(conversation.updated_at).getTime(),
    })
  } catch (error) {
    console.error("[v0] Error in GET conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { messages } = await request.json()

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("short_id", id)
      .eq("user_id", user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Update conversation updated_at using the UUID
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id)

    // Insert new messages using the UUID
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
        return NextResponse.json({ error: msgError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in PATCH conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("short_id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error deleting conversation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
