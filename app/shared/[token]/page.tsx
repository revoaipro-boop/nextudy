import type React from "react"
import { createClient } from "@/lib/supabase/server" // Fixed import path
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, BookOpen } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: Array<{ name: string; url: string; logo: string }>
}

function preprocessMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={index} className="text-xl font-bold mt-4 mb-2">
          {line.slice(2)}
        </h2>,
      )
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="text-lg font-semibold mt-3 mb-2">
          {line.slice(3)}
        </h3>,
      )
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const content = line.trim().slice(2)
      elements.push(
        <div key={index} className="flex gap-2 my-1">
          <span className="text-foreground/70 mt-1">•</span>
          <span className="flex-1">{content}</span>
        </div>,
      )
    } else if (line.trim() === "") {
      elements.push(<div key={index} className="h-2" />)
    } else {
      elements.push(
        <p key={index} className="my-2">
          {line}
        </p>,
      )
    }
  })

  return <div className="space-y-1">{elements}</div>
}

export default async function SharedChatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient() // Added await since createClient is async

  // Fetch shared chat
  const { data: sharedChat, error } = await supabase
    .from("shared_chats")
    .select("*")
    .eq("share_token", token)
    .eq("is_public", true)
    .single()

  if (error || !sharedChat) {
    notFound()
  }

  // Increment views count
  await supabase
    .from("shared_chats")
    .update({ views_count: (sharedChat.views_count || 0) + 1 })
    .eq("id", sharedChat.id)

  const messages = sharedChat.messages as Message[]

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{sharedChat.title}</h1>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {sharedChat.subject}
            </Badge>
            <Badge variant="outline">{sharedChat.format}</Badge>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(sharedChat.created_at).toLocaleDateString("fr-FR")}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {sharedChat.views_count || 0} vues
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`p-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto max-w-[85%]"
                  : "bg-card max-w-[85%]"
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">{preprocessMarkdown(message.content)}</div>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Sources:</p>
                  <div className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs hover:underline text-muted-foreground"
                      >
                        <span>{source.logo}</span>
                        <span className="flex-1 truncate">{source.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">Cette conversation a été partagée depuis Nextudy</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Essayer Nextudy gratuitement
          </a>
        </div>
      </div>
    </div>
  )
}
