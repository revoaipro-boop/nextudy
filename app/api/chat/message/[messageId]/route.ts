import { createClient } from "@/lib/supabase/server"
import { getTaskByMessageId } from "@/lib/generation-tasks"

export async function GET(req: Request, { params }: { params: { messageId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messageId } = params

    const task = await getTaskByMessageId(messageId)

    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if user owns this task
    if (task.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        messageId: task.message_id,
        status: task.status,
        content: task.status === "completed" ? task.final_content : task.partial_content,
        error: task.error_message,
        updatedAt: task.updated_at,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("[v0] Error fetching message:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
