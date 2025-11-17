"use client"

import { use, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Users } from "lucide-react"
import { TextEditor } from "@/components/text-editor"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/components/theme-provider"

export default function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [title, setTitle] = useState("Document partagé")
  const [content, setContent] = useState<any>(null)
  const [documentId, setDocumentId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const { theme, setTheme } = useTheme()
  const [activeUsers, setActiveUsers] = useState(0)
  const [canEdit, setCanEdit] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadSharedDocument()
  }, [token])

  useEffect(() => {
    if (documentId) {
      setupRealtimeSync()
    }
  }, [documentId])

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel(`document:${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          if (payload.new.content && JSON.stringify(payload.new.content) !== JSON.stringify(content)) {
            setContent(payload.new.content)
            setTitle(payload.new.title)
          }
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        setActiveUsers(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadSharedDocument = async () => {
    try {
      // Get shared document info
      const { data: sharedDoc, error: shareError } = await supabase
        .from("shared_documents")
        .select("document_id, can_edit")
        .eq("share_token", token)
        .single()

      if (shareError) throw shareError

      setDocumentId(sharedDoc.document_id)
      setCanEdit(sharedDoc.can_edit)

      // Increment view count
      await supabase.rpc("increment_share_views", { share_token: token })

      // Load document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", sharedDoc.document_id)
        .single()

      if (docError) throw docError

      setTitle(doc.title)
      setContent(doc.content)
    } catch (error) {
      console.error("[v0] Error loading shared document:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le document partagé",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = async (newContent: any) => {
    if (!canEdit) return

    setContent(newContent)

    // Save to database
    try {
      await supabase
        .from("documents")
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
    } catch (error) {
      console.error("[v0] Error saving shared document:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du document partagé...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="font-semibold text-lg truncate">{title}</h1>
            {activeUsers > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{activeUsers} en ligne</span>
              </div>
            )}
            {!canEdit && (
              <span className="text-sm text-muted-foreground bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                Lecture seule
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (theme === "light") setTheme("dark")
              else if (theme === "dark") setTheme("system")
              else setTheme("light")
            }}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <TextEditor content={content} onChange={handleContentChange} documentId={documentId} readOnly={!canEdit} />
      </main>
    </div>
  )
}
