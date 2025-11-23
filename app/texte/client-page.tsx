"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ArrowLeft, Search, FileText, Trash2, Copy } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

interface Document {
  id: string
  title: string
  updated_at: string
  word_count: number
}

export default function ClientPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("documents")
        .select("id, title, updated_at, word_count")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("[v0] Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNewDocument = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: "Document sans titre",
          content: { type: "doc", content: [{ type: "paragraph" }] },
        })
        .select()
        .single()

      if (error) throw error
      router.push(`/texte/${data.id}`)
    } catch (error) {
      console.error("[v0] Error creating document:", error)
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id)
      if (error) throw error
      setDocuments(documents.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting document:", error)
    }
  }

  const duplicateDocument = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: original, error: fetchError } = await supabase
        .from("documents")
        .select("title, content")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: `${original.title} (copie)`,
          content: original.content,
        })
        .select()
        .single()

      if (error) throw error
      router.push(`/texte/${data.id}`)
    } catch (error) {
      console.error("[v0] Error duplicating document:", error)
    }
  }

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Mes Documents</h1>
            </div>
          </div>
          <Button onClick={createNewDocument} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau document
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {searchQuery ? "Aucun document trouvé" : "Aucun document pour le moment"}
            </p>
            {!searchQuery && (
              <Button onClick={createNewDocument} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer votre premier document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex-1 mb-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{doc.word_count || 0} mots</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/texte/${doc.id}`)}
                    >
                      Ouvrir
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => duplicateDocument(doc.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
