import { createClient } from "@/lib/supabase/server"

export interface GenerationTask {
  id: string
  user_id: string
  conversation_id?: string
  message_id: string
  status: "generating" | "completed" | "failed"
  partial_content: string
  final_content?: string
  error_message?: string
  created_at: string
  updated_at: string
  completed_at?: string
  subject: string
  grade: string
  format: string
  messages_context: any[]
}

export async function createGenerationTask(
  userId: string,
  messageId: string,
  conversationId: string | null,
  subject: string,
  grade: string,
  format: string,
  messagesContext: any[]
): Promise<string> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("generation_tasks")
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      message_id: messageId,
      status: "generating",
      subject,
      grade,
      format,
      messages_context: messagesContext,
      partial_content: "",
    })
    .select("id")
    .single()

  if (error) {
    console.error("[v0] Error creating generation task:", error)
    throw new Error("Failed to create generation task")
  }

  return data.id
}

export async function getGenerationTask(taskId: string): Promise<GenerationTask | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (error) {
    console.error("[v0] Error fetching generation task:", error)
    return null
  }

  return data
}

export async function getTaskByMessageId(messageId: string): Promise<GenerationTask | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("*")
    .eq("message_id", messageId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function updateTaskContent(taskId: string, content: string, isComplete: boolean = false) {
  const supabase = await createClient()
  
  const updateData: any = {
    partial_content: content,
    updated_at: new Date().toISOString(),
  }

  if (isComplete) {
    updateData.status = "completed"
    updateData.final_content = content
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("generation_tasks")
    .update(updateData)
    .eq("id", taskId)

  if (error) {
    console.error("[v0] Error updating task content:", error)
    throw new Error("Failed to update task content")
  }
}

export async function markTaskFailed(taskId: string, errorMessage: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("generation_tasks")
    .update({
      status: "failed",
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)

  if (error) {
    console.error("[v0] Error marking task as failed:", error)
  }
}
