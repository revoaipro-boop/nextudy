"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ArrowLeft, Upload, FileText, Loader2, Download } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { extractPDFText } from "@/lib/pdf-extractor"
import { BookSummaryDisplay } from "@/components/book-summary-display"

export default function NewBookSummaryPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  // PDF Upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Manual entry state
  const [bookTitle, setBookTitle] = useState("")
  const [author, setAuthor] = useState("")

  // Results state
  const [summary, setSummary] = useState("")
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router])

  const handlePDFUpload = async () => {
    if (!pdfFile) return

    setIsProcessing(true)
    setError("")

    try {
      console.log("[v0] Extracting text from PDF...")
      const extractedText = await extractPDFText(pdfFile)

      console.log("[v0] Sending to book summary API...")
      const response = await fetch("/api/book-summary-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: pdfFile.name.replace(".pdf", ""),
          author: "Auteur inconnu",
          bookContent: extractedText,
          includeQA: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la génération du résumé")
      }

      const data = await response.json()
      setSummary(data.summary)
      setShowResults(true)
    } catch (err) {
      console.error("[v0] Error processing PDF:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualEntry = async () => {
    if (!bookTitle || !author) {
      setError("Veuillez remplir le titre et l'auteur")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      console.log("[v0] Generating summary from title and author...")
      const response = await fetch("/api/book-summary-from-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle,
          author,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la génération du résumé")
      }

      const data = await response.json()
      setSummary(data.summary)
      setShowResults(true)
    } catch (err) {
      console.error("[v0] Error generating summary:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPDF = () => {
    // Create a simple HTML document for PDF generation
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${bookTitle || pdfFile?.name || "Résumé de livre"}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              h2 { color: #555; margin-top: 30px; }
              h3 { color: #666; margin-top: 20px; }
              p { margin: 10px 0; }
              .source { background: #f0f0f0; padding: 5px 10px; margin: 5px 0; border-left: 3px solid #333; }
            </style>
          </head>
          <body>
            <h1>${bookTitle || pdfFile?.name || "Résumé de livre"}</h1>
            <p><strong>Auteur:</strong> ${author || "Auteur inconnu"}</p>
            <hr>
            ${summary.replace(/\n/g, "<br>")}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (showResults && summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowResults(false)} className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Nouvelle analyse
              </Button>
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Télécharger PDF
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          <BookSummaryDisplay
            title={bookTitle || pdfFile?.name.replace(".pdf", "") || "Résumé de livre"}
            author={author || "Auteur inconnu"}
            content={summary}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <Button variant="ghost" size="icon" className="group-hover:scale-110 transition-all duration-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Retour à l'accueil</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 max-w-4xl">
        <div className="text-center space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-3xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent px-4">
              Résumé de Livre avec Sources
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground font-medium px-4">
              Analyse complète avec citations des sources
            </p>
          </div>
        </div>

        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
            <TabsTrigger value="pdf" className="text-sm sm:text-base">
              Importer un PDF
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-sm sm:text-base">
              Titre + Auteur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 sm:space-y-6">
            <Card
              className={`border-2 transition-all duration-300 ${
                isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file && file.type === "application/pdf") {
                  setPdfFile(file)
                  setError("")
                } else {
                  setError("Veuillez déposer un fichier PDF")
                }
              }}
            >
              <div className="p-8 sm:p-12 text-center space-y-4">
                {!pdfFile ? (
                  <>
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg font-medium">Déposez votre PDF ici</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Ou cliquez pour sélectionner</p>
                    </div>
                    <label htmlFor="pdf-upload">
                      <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                        <span>Choisir un fichier</span>
                      </Button>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setPdfFile(file)
                            setError("")
                          }
                        }}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg font-medium break-all px-4">{pdfFile.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button onClick={handlePDFUpload} disabled={isProcessing} className="gap-2">
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4" />
                            Générer le résumé
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setPdfFile(null)} disabled={isProcessing}>
                        Changer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 sm:space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm sm:text-base">
                    Titre du livre
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Le Petit Prince"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-sm sm:text-base">
                    Auteur
                  </Label>
                  <Input
                    id="author"
                    placeholder="Ex: Antoine de Saint-Exupéry"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="text-sm sm:text-base"
                  />
                </div>
                <Button
                  onClick={handleManualEntry}
                  disabled={isProcessing || !bookTitle || !author}
                  className="w-full gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Générer le résumé
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5 mt-4">
            <div className="p-4 text-sm text-destructive">{error}</div>
          </Card>
        )}
      </main>
    </div>
  )
}
