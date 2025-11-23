"use client"

import { use, useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Download, Moon, Sun, ChevronDown, Share2, Copy, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TextEditor } from "@/components/text-editor"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [title, setTitle] = useState("Document sans titre")
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { theme, setTheme } = useTheme()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [activeUsers, setActiveUsers] = useState(0)
  const isLocalUpdate = useRef(false)
  const editorRef = useRef<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadDocument()
    setupRealtimeSync()
  }, [id])

  useEffect(() => {
    const interval = setInterval(() => {
      if (content && !saving) {
        saveDocument(true)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [content, title, saving])

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel(`document:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (!isLocalUpdate.current) {
            console.log("[v0] Document updated by another user")
            if (payload.new.content && JSON.stringify(payload.new.content) !== JSON.stringify(content)) {
              setContent(payload.new.content)
              setTitle(payload.new.title)
              toast({
                title: "Document mis à jour",
                description: "Un autre utilisateur a modifié le document",
              })
            }
          }
          isLocalUpdate.current = false
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

  const loadDocument = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single()

      if (error) throw error
      setTitle(data.title)
      setContent(data.content)
    } catch (error) {
      console.error("[v0] Error loading document:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le document",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveDocument = async (isAutoSave = false) => {
    if (!content || saving) return

    isLocalUpdate.current = true
    setSaving(true)
    try {
      const text = JSON.stringify(content)
      const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length

      const { error } = await supabase
        .from("documents")
        .update({
          title,
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
      setLastSaved(new Date())

      if (!isAutoSave) {
        toast({
          title: "Sauvegardé",
          description: "Document enregistré avec succès",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving document:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le document",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setTimeout(() => {
        isLocalUpdate.current = false
      }, 1000)
    }
  }

  const exportDocument = async (format: "pdf" | "docx" | "txt" | "md") => {
    if (!content) {
      toast({
        title: "Erreur",
        description: "Aucun contenu à exporter",
        variant: "destructive",
      })
      return
    }

    setExporting(true)

    try {
      if (format === "txt") {
        const text = content.content?.map((node: any) => extractText(node)).join("\n\n") || ""
        const blob = new Blob([text], { type: "text/plain" })
        downloadBlob(blob, `${title}.txt`)
        toast({ title: "Texte exporté", description: "Le document a été téléchargé en TXT" })
      } else if (format === "md") {
        const markdown = convertToMarkdown(content)
        const blob = new Blob([markdown], { type: "text/markdown" })
        downloadBlob(blob, `${title}.md`)
        toast({ title: "Markdown exporté", description: "Le document a été téléchargé en Markdown" })
      } else if (format === "pdf") {
        try {
          const { jsPDF } = await import("jspdf")

          const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          })

          const textContent = content.content?.map((node: any) => extractText(node)).join("\n\n") || ""

          doc.setFontSize(20)
          doc.setFont("helvetica", "bold")
          doc.text(title, 20, 20, { maxWidth: 170 })

          doc.setFontSize(12)
          doc.setFont("helvetica", "normal")

          const lines = doc.splitTextToSize(textContent, 170)

          let yPosition = 40
          const pageHeight = 280
          const lineHeight = 7

          lines.forEach((line: string) => {
            if (yPosition > pageHeight) {
              doc.addPage()
              yPosition = 20
            }
            doc.text(line, 20, yPosition)
            yPosition += lineHeight
          })

          doc.save(`${title}.pdf`)

          toast({
            title: "PDF exporté",
            description: "Le document a été téléchargé en PDF avec succès",
          })
        } catch (pdfError: any) {
          console.error("[v0] PDF export error:", pdfError)
          throw new Error("Erreur lors de la génération du PDF. Veuillez réessayer.")
        }
      } else if (format === "docx") {
        try {
          const htmlDocx = (await import("html-docx-js/dist/html-docx")).default

          const element = document.querySelector(".ProseMirror")
          const editorHTML = element?.innerHTML || ""

          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #000; 
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20mm;
                  }
                  h1, h2, h3, h4, h5, h6 { margin-top: 20px; margin-bottom: 10px; font-weight: bold; }
                  h1 { font-size: 24pt; }
                  h2 { font-size: 20pt; }
                  h3 { font-size: 16pt; }
                  p { margin: 10px 0; }
                  strong, b { font-weight: bold; }
                  em, i { font-style: italic; }
                  u { text-decoration: underline; }
                  s { text-decoration: line-through; }
                  table { border-collapse: collapse; width: 100%; margin: 15px 0; }
                  td, th { border: 1px solid #000; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; font-weight: bold; }
                  img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
                  ul, ol { margin: 10px 0; padding-left: 30px; }
                  li { margin: 5px 0; }
                  blockquote { border-left: 4px solid #ddd; padding-left: 15px; margin: 15px 0; }
                  code { background: #f4f4f4; padding: 2px 4px; font-family: monospace; }
                  pre { background: #f4f4f4; padding: 10px; }
                </style>
              </head>
              <body>
                <h1>${title}</h1>
                ${editorHTML}
              </body>
            </html>
          `

          const docx = htmlDocx.asBlob(html)
          downloadBlob(docx, `${title}.docx`)
          toast({ title: "DOCX exporté", description: "Le document a été téléchargé en DOCX" })
        } catch (docxError: any) {
          console.error("[v0] DOCX export error:", docxError)
          throw new Error("Erreur lors de la génération du DOCX. Veuillez réessayer.")
        }
      }
    } catch (error: any) {
      console.error("[v0] Error exporting document:", error)
      toast({
        title: "Erreur d'exportation",
        description: error.message || `Impossible d'exporter en ${format.toUpperCase()}`,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: existing } = await supabase
        .from("shared_documents")
        .select("share_token")
        .eq("document_id", id)
        .single()

      let token = existing?.share_token

      if (!token) {
        token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        const { error } = await supabase.from("shared_documents").insert({
          document_id: id,
          share_token: token,
          created_by: user.id,
          is_public: true,
          can_edit: true,
        })

        if (error) throw error

        await supabase.from("documents").update({ is_public: true }).eq("id", id)
      }

      const link = `${window.location.origin}/texte/shared/${token}`
      setShareLink(link)
      setShareDialogOpen(true)

      toast({
        title: "Lien de partage créé",
        description: "Le document peut maintenant être partagé et édité collaborativement",
      })
    } catch (error) {
      console.error("[v0] Error creating share link:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien de partage",
        variant: "destructive",
      })
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast({
      title: "Lien copié",
      description: "Le lien de partage a été copié dans le presse-papier",
    })
  }

  const extractText = (node: any): string => {
    if (node.type === "text") {
      return node.text || ""
    }
    if (node.content) {
      return node.content.map((child: any) => extractText(child)).join("")
    }
    return ""
  }

  const convertToMarkdown = (content: any): string => {
    if (!content.content) return ""

    return content.content
      .map((node: any) => {
        if (node.type === "heading") {
          const level = "#".repeat(node.attrs?.level || 1)
          const text = node.content?.map((n: any) => extractText(n)).join("") || ""
          return `${level} ${text}`
        }
        if (node.type === "paragraph") {
          return node.content?.map((n: any) => extractText(n)).join("") || ""
        }
        if (node.type === "bulletList") {
          return (
            node.content
              ?.map((item: any) => {
                const text = item.content?.[0]?.content?.map((n: any) => extractText(n)).join("") || ""
                return `- ${text}`
              })
              .join("\n") || ""
          )
        }
        return extractText(node)
      })
      .join("\n\n")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/texte">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-md font-semibold text-lg border-none focus-visible:ring-0 px-2 bg-transparent"
              placeholder="Titre du document"
            />
            {activeUsers > 1 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{activeUsers} en ligne</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

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

            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Partager</span>
            </Button>

            <Button variant="outline" size="sm" onClick={() => saveDocument()} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" disabled={exporting}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{exporting ? "Export..." : "Exporter"}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportDocument("pdf")} disabled={exporting}>
                  📄 Exporter en PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocument("docx")} disabled={exporting}>
                  📝 Exporter en DOCX
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportDocument("txt")} disabled={exporting}>
                  💬 Télécharger en TXT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocument("md")} disabled={exporting}>
                  💡 Télécharger en Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <TextEditor content={content} onChange={setContent} documentId={id} />
      </main>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le document</DialogTitle>
            <DialogDescription>
              Toute personne ayant ce lien pourra voir et modifier ce document en temps réel.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button onClick={copyShareLink} size="icon" variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Les modifications sont synchronisées en temps réel entre tous les utilisateurs.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
