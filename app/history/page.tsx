"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ChatHistory {
  id: string
  subject: string
  grade: string
  format: string
  messages: Array<{ role: string; content: string }>
  created_at: string
}

interface Summary {
  id: string
  filename: string
  subject: string
  created_at: string
}

interface HistoryItem {
  id: string
  type: "chat" | "summary" | "flashcard" | "document"
  title: string
  preview: string
  date: string
  icon: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadHistory = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      try {
        const { data: chatData } = await supabase
          .from("chat_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        const { data: summaryData } = await supabase
          .from("summaries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        const historyItems: HistoryItem[] = []

        if (chatData) {
          chatData.forEach((chat: ChatHistory) => {
            const formatLabel =
              chat.format === "kid" ? "Mode Enfant" : chat.format === "correction" ? "Mode Correction" : "Mode Normal"
            const firstUserMessage = chat.messages.find((m) => m.role === "user")?.content || "Nouvelle conversation"
            const preview = firstUserMessage.length > 80 ? firstUserMessage.slice(0, 80) + "..." : firstUserMessage

            historyItems.push({
              id: chat.id,
              type: "chat",
              title: `ChatIA – ${chat.subject} – ${formatLabel}`,
              preview,
              date: new Date(chat.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }),
              icon: "💬",
            })
          })
        }

        if (summaryData) {
          summaryData.forEach((summary: Summary) => {
            historyItems.push({
              id: summary.id,
              type: "summary",
              title: `Résumé – ${summary.filename || summary.subject}`,
              preview: `Document résumé pour ${summary.subject}`,
              date: new Date(summary.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }),
              icon: "📄",
            })
          })
        }

        historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setHistory(historyItems)
      } catch (error) {
        console.error("[v0] Error loading history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [router])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Historique</h1>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun historique pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Commence à utiliser Nextudy pour voir ton historique ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.preview}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
