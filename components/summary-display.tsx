"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  RotateCcw,
  Copy,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Printer,
  Brain,
  RefreshCw,
  Clock,
} from "lucide-react"
import { useState, useEffect } from "react"
import { FlashcardSet, type FlashcardData } from "@/components/flashcard"
import { QCMDisplay, type QCMQuestion } from "@/components/qcm-display"
import { useToast } from "@/hooks/use-toast"

interface SummaryDisplayProps {
  summary?: string
  shortSummary?: string
  keywords?: Array<{ term: string; definition: string }>
  filename: string
  flashcards?: FlashcardData[]
  qcm?: QCMQuestion[]
  subject?: string
  summaryId?: string
  textContent?: string
  onReset: () => void
}

function preprocessMarkdown(text: string): string {
  // Split by lines
  const lines = text.split("\n")
  const processed = lines.map((line) => {
    // Replace headings with bold text
    if (line.match(/^#{1,6}\s/)) {
      // Remove # symbols and make text bold
      const cleanedLine = line.replace(/^#{1,6}\s+/, "").trim()
      return `**${cleanedLine}**`
    }
    return line
  })

  return processed.join("\n")
}

export function SummaryDisplay({
  summary,
  shortSummary,
  keywords,
  filename,
  flashcards,
  qcm,
  subject,
  summaryId,
  textContent,
  onReset,
}: SummaryDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [currentFlashcards, setCurrentFlashcards] = useState(flashcards)
  const [currentQcm, setCurrentQcm] = useState(qcm)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const getInitialTab = () => {
    if (summary) return "summary"
    if (shortSummary) return "revision"
    if (currentQcm && currentQcm.length > 0) return "qcm"
    if (currentFlashcards && currentFlashcards.length > 0) return "flashcards"
    return "summary"
  }

  const [activeTab, setActiveTab] = useState<"summary" | "revision" | "keywords" | "qcm" | "flashcards">(
    getInitialTab(),
  )

  const processedSummary = summary ? preprocessMarkdown(summary) : undefined
  const processedShortSummary = shortSummary ? preprocessMarkdown(shortSummary) : undefined

  const handleCopy = async () => {
    const textToCopy =
      activeTab === "summary"
        ? summary
        : activeTab === "revision"
          ? shortSummary
          : activeTab === "keywords"
            ? keywords?.map((k) => `${k.term} : ${k.definition}`).join("\n")
            : activeTab === "qcm"
              ? currentQcm
                  ?.map(
                    (q, i) =>
                      `Q${i + 1}: ${q.question}\nOptions: ${q.options.join(", ")}\nRéponse: ${q.options[q.correctAnswer]}`,
                  )
                  .join("\n\n")
              : currentFlashcards?.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join("\n\n")

    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const contentToPrint = activeTab === "summary" ? summary : activeTab === "revision" ? shortSummary : ""

    const title = activeTab === "summary" ? "Résumé long" : "Fiche de révision"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${filename}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              color: #1a1a1a;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 24px;
              margin-bottom: 16px;
              font-weight: 600;
              line-height: 1.25;
            }
            h1 { font-size: 2em; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3em; }
            h2 { font-size: 1.5em; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3em; }
            h3 { font-size: 1.25em; }
            p { margin-bottom: 16px; }
            ul, ol { margin-bottom: 16px; padding-left: 2em; }
            li { margin-bottom: 8px; }
            strong { font-weight: 600; }
            em { font-style: italic; }
            code { 
              background: #f6f6f6; 
              padding: 2px 6px; 
              border-radius: 3px;
              font-family: monospace;
            }
            .header {
              margin-bottom: 40px;
              border-bottom: 2px solid #1a1a1a;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 8px 0;
              border: none;
            }
            .header p {
              margin: 0;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>${filename}</p>
            ${subject ? `<p>Matière: ${subject}</p>` : ""}
          </div>
          <div class="content">
            ${contentToPrint ? contentToPrint.replace(/\n/g, "<br>") : ""}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleRegenerate = async (type: "flashcards" | "qcm") => {
    console.log("[v0] Regenerate clicked:", { type, summaryId, hasTextContent: !!textContent })

    if (!summaryId || !textContent) {
      console.error("[v0] Missing summaryId or textContent for regeneration", { summaryId, textContent: !!textContent })
      toast({
        title: "Erreur",
        description: "Impossible de régénérer : données manquantes",
        variant: "destructive",
      })
      return
    }

    if (cooldownSeconds > 0) {
      toast({
        title: "Veuillez patienter",
        description: `Vous pourrez régénérer dans ${cooldownSeconds} secondes`,
        variant: "destructive",
      })
      return
    }

    setIsRegenerating(true)
    console.log("[v0] Starting regeneration request")

    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryId,
          textContent,
          type,
          subject,
          existingFlashcards: type === "flashcards" ? currentFlashcards : undefined,
          existingQcm: type === "qcm" ? currentQcm : undefined,
        }),
      })

      console.log("[v0] Regenerate response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Regenerate response data:", data)

        if (type === "flashcards" && data.flashcards) {
          setCurrentFlashcards(data.flashcards)
          toast({
            title: "Succès",
            description: `${data.flashcards.length} nouvelles flashcards générées`,
          })
          setCooldownSeconds(5)
        } else if (type === "qcm" && data.qcm) {
          setCurrentQcm(data.qcm)
          toast({
            title: "Succès",
            description: `${data.qcm.length} nouvelles questions générées`,
          })
          setCooldownSeconds(5)
        } else {
          toast({
            title: "Attention",
            description: "Aucune donnée générée",
            variant: "destructive",
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Failed to regenerate:", errorData)

        if (response.status === 429 || errorData.rateLimitError) {
          const retryAfter = errorData.retryAfter || 30
          setCooldownSeconds(retryAfter)

          toast({
            title: "Limite de taux atteinte",
            description: `Trop de requêtes. Veuillez patienter ${retryAfter} secondes.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erreur",
            description: errorData.error || "Échec de la régénération",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error during regeneration:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la régénération",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
      console.log("[v0] Regeneration complete")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Card className="border-accent/20 bg-accent/5 hover-lift">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
              <FileText className="h-5 w-5 dark:text-gray-100 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Contenu structuré</p>
                {subject && (
                  <Badge variant="secondary" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {subject}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground/70">{filename}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent hover-lift">
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="gap-2 bg-transparent hover-lift">
              <RotateCcw className="h-4 w-4" />
              Nouveau
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-0 scrollbar-hide">
        {summary && (
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 whitespace-nowrap transition-all duration-200 px-4 py-3 ${
              activeTab === "summary"
                ? "border-primary text-foreground bg-primary/5 font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/5"
            }`}
            onClick={() => setActiveTab("summary")}
          >
            Résumé long
          </Button>
        )}
        {shortSummary && (
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 whitespace-nowrap transition-all duration-200 px-4 py-3 ${
              activeTab === "revision"
                ? "border-primary text-foreground bg-primary/5 font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/5"
            }`}
            onClick={() => setActiveTab("revision")}
          >
            Fiche de révision
          </Button>
        )}
        {currentFlashcards && currentFlashcards.length > 0 && (
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 gap-2 whitespace-nowrap transition-all duration-200 px-4 py-3 ${
              activeTab === "flashcards"
                ? "border-primary text-foreground bg-primary/5 font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/5"
            }`}
            onClick={() => setActiveTab("flashcards")}
          >
            <Sparkles className="h-4 w-4" />
            Flashcards ({currentFlashcards.length})
          </Button>
        )}
        {currentQcm && currentQcm.length > 0 && (
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 gap-2 whitespace-nowrap transition-all duration-200 px-4 py-3 ${
              activeTab === "qcm"
                ? "border-primary text-foreground bg-primary/5 font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/5"
            }`}
            onClick={() => setActiveTab("qcm")}
          >
            <Brain className="h-4 w-4" />
            QCM ({currentQcm.length})
          </Button>
        )}
      </div>

      <Card className="hover-lift">
        <div className="p-8">
          {activeTab === "summary" && !summary && (
            <div className="text-center py-12 text-foreground/60">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Aucun résumé long généré</p>
              <p className="text-sm">Sélectionnez l'option "Résumé long" lors de la prochaine génération</p>
            </div>
          )}
          {activeTab === "summary" && processedSummary && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-balance text-white">Résumé long</h3>
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-transparent hover-lift">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
              <div className="space-y-4 leading-relaxed whitespace-pre-wrap">
                {processedSummary.split("\n").map((line, index) => {
                  if (line.match(/^\*\*.*\*\*$/)) {
                    const text = line.replace(/\*\*/g, "")
                    return (
                      <h4
                        key={index}
                        className="font-bold text-xl mt-8 mb-4 text-white border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded"
                      >
                        {text}
                      </h4>
                    )
                  }
                  if (line.trim()) {
                    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/)
                    return (
                      <p key={index} className="mb-3 text-white/90 leading-loose text-[15px]">
                        {parts.map((part, i) => {
                          if (part.match(/^\*\*.*\*\*$/)) {
                            return (
                              <strong key={i} className="text-white font-semibold">
                                {part.replace(/\*\*/g, "")}
                              </strong>
                            )
                          } else if (part.match(/^\*.*\*$/)) {
                            return (
                              <span key={i} className="text-white/95">
                                {part.replace(/\*/g, "")}
                              </span>
                            )
                          }
                          return (
                            <span key={i} className="text-white/90">
                              {part}
                            </span>
                          )
                        })}
                      </p>
                    )
                  }
                  return <div key={index} className="h-3" />
                })}
              </div>
            </div>
          )}

          {activeTab === "revision" && !shortSummary && (
            <div className="text-center py-12 text-foreground/60">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Aucune fiche de révision générée</p>
              <p className="text-sm">Sélectionnez l'option "Fiche de révision" lors de la prochaine génération</p>
            </div>
          )}
          {activeTab === "revision" && processedShortSummary && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-balance text-foreground">Fiche de révision</h3>
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-transparent hover-lift">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
              <div className="space-y-4 leading-relaxed whitespace-pre-wrap text-foreground">
                {processedShortSummary.split("\n").map((line, index) => {
                  if (line.match(/^\*\*.*\*\*$/)) {
                    const text = line.replace(/\*\*/g, "")
                    return (
                      <p key={index} className="font-bold text-lg mt-6 mb-3 text-foreground">
                        {text}
                      </p>
                    )
                  }
                  if (line.trim()) {
                    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/)
                    return (
                      <p key={index} className="mb-2 text-foreground">
                        {parts.map((part, i) => {
                          if (part.match(/^\*\*.*\*\*$/)) {
                            return (
                              <strong key={i} className="text-foreground">
                                {part.replace(/\*\*/g, "")}
                              </strong>
                            )
                          } else if (part.match(/^\*.*\*$/)) {
                            return (
                              <span key={i} className="text-[1.05em] text-foreground">
                                {part.replace(/\*/g, "")}
                              </span>
                            )
                          }
                          return (
                            <span key={i} className="text-foreground">
                              {part}
                            </span>
                          )
                        })}
                      </p>
                    )
                  }
                  return <br key={index} />
                })}
              </div>
            </div>
          )}

          {activeTab === "qcm" && (!currentQcm || currentQcm.length === 0) && (
            <div className="text-center py-12 text-foreground/60">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Aucun QCM généré</p>
              <p className="text-sm">Sélectionnez l'option "QCM" lors de la prochaine génération</p>
            </div>
          )}
          {activeTab === "qcm" && currentQcm && currentQcm.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-balance text-foreground">Quiz à choix multiples</h3>
                  <p className="text-foreground/70 mt-2 leading-relaxed">
                    Testez vos connaissances avec ce quiz généré automatiquement à partir du document.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate("qcm")}
                  disabled={isRegenerating || cooldownSeconds > 0}
                  className="gap-2 bg-transparent hover-lift"
                >
                  {cooldownSeconds > 0 ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Attendre {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      {isRegenerating ? "Génération..." : "Nouveau QCM"}
                    </>
                  )}
                </Button>
              </div>
              <QCMDisplay questions={currentQcm} />
            </div>
          )}

          {activeTab === "flashcards" && (!currentFlashcards || currentFlashcards.length === 0) && (
            <div className="text-center py-12 text-foreground/60">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Aucune flashcard générée</p>
              <p className="text-sm">Sélectionnez l'option "Flashcards" lors de la prochaine génération</p>
            </div>
          )}
          {activeTab === "flashcards" && currentFlashcards && currentFlashcards.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-balance text-foreground">Flashcards de révision</h3>
                  <p className="text-foreground/70 mt-2 leading-relaxed">
                    Révisez les concepts clés avec ces flashcards générées automatiquement. Cliquez sur une carte pour
                    révéler la réponse.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate("flashcards")}
                  disabled={isRegenerating || cooldownSeconds > 0}
                  className="gap-2 bg-transparent hover-lift"
                >
                  {cooldownSeconds > 0 ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Attendre {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      {isRegenerating ? "Génération..." : "Nouvelles flashcards"}
                    </>
                  )}
                </Button>
              </div>
              <FlashcardSet flashcards={currentFlashcards} />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
