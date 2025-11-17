"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ChatInterface from "@/components/chat-interface"
import { loadConversation } from "@/lib/conversations"

interface ChatInterfaceWrapperProps {
  conversationId?: string
  subject: string
  grade: string
  format: "normal" | "kid" | "correction"
}

export function ChatInterfaceWrapper({
  conversationId,
  subject,
  grade,
  format,
}: ChatInterfaceWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(!!conversationId)
  const [conversation, setConversation] = useState<any>(null)

  useEffect(() => {
    const loadExistingConversation = async () => {
      if (!conversationId) {
        setIsLoading(false)
        return
      }

      try {
        const conv = await loadConversation(conversationId)
        if (conv) {
          setConversation(conv)
        } else {
          // Conversation not found, redirect to new chat
          router.push(`/chat-ia?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}&format=${format}`)
        }
      } catch (error) {
        console.error("[v0] Error loading conversation:", error)
        router.push(`/chat-ia?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}&format=${format}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingConversation()
  }, [conversationId, router, subject, grade, format])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Chargement de la conversation...</p>
      </div>
    )
  }

  return (
    <ChatInterface
      conversationId={conversationId}
      initialMessages={conversation?.messages || []}
      subject={conversation?.subject || subject}
      grade={conversation?.grade || grade}
      format={conversation?.format || format}
    />
  )
}

export default ChatInterfaceWrapper
