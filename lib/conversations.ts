export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ name: string; url: string; logo: string }>
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  subject: string
  grade: string
  format: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

/**
 * Generate a conversation title from the first user message
 * Returns a clear, concise title (40-55 characters max)
 */
export function generateConversationTitle(firstUserMessage: string): string {
  // Remove extra whitespace and truncate
  const cleaned = firstUserMessage.trim().replace(/\s+/g, ' ')
  
  // Extract key words and create a meaningful title
  const words = cleaned.split(' ')
  let title = ''
  
  // Build title word by word until we reach ideal length
  for (const word of words) {
    const testTitle = title ? `${title} ${word}` : word
    if (testTitle.length > 55) break
    title = testTitle
  }
  
  // Ensure title has proper capitalization
  title = title.charAt(0).toUpperCase() + title.slice(1)
  
  // Remove trailing punctuation if any
  title = title.replace(/[.,!?;:]$/, '')
  
  // If title is too short or generic, use a more descriptive format
  if (title.length < 10) {
    return "Nouvelle conversation"
  }
  
  return title
}

/**
 * Create a new conversation
 */
export async function createConversation(
  subject: string,
  grade: string,
  format: string,
  firstMessage?: Message
): Promise<string> {
  const title = firstMessage 
    ? generateConversationTitle(firstMessage.content)
    : "Nouvelle conversation"
  
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      subject,
      grade,
      format,
      messages: firstMessage ? [firstMessage] : []
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to create conversation')
  }
  
  const { conversationId } = await response.json()
  return conversationId
}

/**
 * Load a conversation by ID
 */
export async function loadConversation(id: string): Promise<Conversation | null> {
  const response = await fetch(`/api/conversations/${id}`)
  
  if (!response.ok) {
    return null
  }
  
  const conversation = await response.json()
  return conversation
}

/**
 * Update conversation with new messages
 */
export async function updateConversation(
  id: string,
  messages: Message[]
): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })
  
  if (!response.ok) {
    throw new Error('Failed to update conversation')
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete conversation')
  }
}

/**
 * List all conversations for current user
 */
export async function listConversations(): Promise<Conversation[]> {
  const response = await fetch('/api/conversations')
  
  if (!response.ok) {
    return []
  }
  
  const { conversations } = await response.json()
  return conversations
}
