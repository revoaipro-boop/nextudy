"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Mic, Trash2, Calendar, Sparkles, HelpCircle } from "lucide-react"
import { storage, type SavedSummary } from "@/lib/storage"
import { FlashcardSet } from "@/components/flashcard"
import { QCMDisplay } from "@/components/qcm-display"

function preprocessMarkdown(text: string): string {
  const lines = text.split("\n")
  const processed = lines.map((line) => {
    if (line.match(/^#{1,6}\s/)) {
      const cleanedLine = line.replace(/^#{1,6}\s+/, "").trim()
      return `**${cleanedLine}**`
    }
    return line
  })

  return processed.join("\n")
}

export function HistoryView() {
  const [summaries, setSummaries] = useState<SavedSummary[]>([])
  const [selectedSummary, setSelectedSummary] = useState<SavedSummary | null>(null)
  const [activeTab, setActiveTab] = useState<"summary" | "short" | "flashcards" | "qcm">("summary")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSummaries()
  }, [])

  const loadSummaries = async () => {
    setIsLoading(true)
    const data = await storage.getSummaries()
    setSummaries(data)
    setIsLoading(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await storage.deleteSummary(id)
    await loadSummaries()
    if (selectedSummary?.id === id) {
      setSelectedSummary(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (selectedSummary) {
    const processedSummary = selectedSummary.summary ? preprocessMarkdown(selectedSummary.summary) : undefined
    const processedShortSummary = selectedSummary.shortSummary
      ? preprocessMarkdown(selectedSummary.shortSummary)
      : undefined

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => setSelectedSummary(null)} className="mb-4">
          ← Retour à l&apos;historique
        </Button>

        <Card className="border-primary/20 bg-primary/5">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                {selectedSummary.type === "audio" ? (
                  <Mic className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium">{selectedSummary.filename}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedSummary.createdAt)}
                </p>
                {selectedSummary.subject && (
                  <p className="text-sm text-muted-foreground">Matière: {selectedSummary.subject}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {selectedSummary.summary && (
            <Button
              variant="ghost"
              className={`rounded-none border-b-2 whitespace-nowrap ${
                activeTab === "summary" ? "border-primary text-primary" : "border-transparent"
              }`}
              onClick={() => setActiveTab("summary")}
            >
              Résumé détaillé
            </Button>
          )}
          {selectedSummary.shortSummary && (
            <Button
              variant="ghost"
              className={`rounded-none border-b-2 whitespace-nowrap ${
                activeTab === "short" ? "border-primary text-primary" : "border-transparent"
              }`}
              onClick={() => setActiveTab("short")}
            >
              Fiche de révision
            </Button>
          )}
          {selectedSummary.flashcards.length > 0 && (
            <Button
              variant="ghost"
              className={`rounded-none border-b-2 gap-2 whitespace-nowrap ${
                activeTab === "flashcards" ? "border-primary text-primary" : "border-transparent"
              }`}
              onClick={() => setActiveTab("flashcards")}
            >
              <Sparkles className="h-4 w-4" />
              Flashcards ({selectedSummary.flashcards.length})
            </Button>
          )}
          {selectedSummary.qcm && selectedSummary.qcm.length > 0 && (
            <Button
              variant="ghost"
              className={`rounded-none border-b-2 gap-2 whitespace-nowrap ${
                activeTab === "qcm" ? "border-primary text-primary" : "border-transparent"
              }`}
              onClick={() => setActiveTab("qcm")}
            >
              <HelpCircle className="h-4 w-4" />
              QCM ({selectedSummary.qcm.length})
            </Button>
          )}
        </div>

        <Card>
          <div className="p-8">
            {activeTab === "summary" && processedSummary && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold mb-6 text-balance">Résumé détaillé</h3>
                <div className="space-y-4 leading-relaxed whitespace-pre-wrap">
                  {processedSummary.split("\n").map((line, index) => {
                    if (line.match(/^\*\*.*\*\*$/)) {
                      const text = line.replace(/\*\*/g, "")
                      return (
                        <p key={index} className="font-bold text-lg mt-6 mb-3">
                          {text}
                        </p>
                      )
                    }
                    if (line.trim()) {
                      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/)
                      return (
                        <p key={index} className="mb-2">
                          {parts.map((part, i) => {
                            if (part.match(/^\*\*.*\*\*$/)) {
                              return <strong key={i}>{part.replace(/\*\*/g, "")}</strong>
                            } else if (part.match(/^\*.*\*$/)) {
                              return (
                                <span key={i} className="text-[1.05em]">
                                  {part.replace(/\*/g, "")}
                                </span>
                              )
                            }
                            return <span key={i}>{part}</span>
                          })}
                        </p>
                      )
                    }
                    return <br key={index} />
                  })}
                </div>
              </div>
            )}
            {activeTab === "short" && processedShortSummary && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold mb-6 text-balance">Fiche de révision</h3>
                <div className="space-y-4 leading-relaxed whitespace-pre-wrap">
                  {processedShortSummary.split("\n").map((line, index) => {
                    if (line.match(/^\*\*.*\*\*$/)) {
                      const text = line.replace(/\*\*/g, "")
                      return (
                        <p key={index} className="font-bold text-lg mt-6 mb-3">
                          {text}
                        </p>
                      )
                    }
                    if (line.trim()) {
                      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/)
                      return (
                        <p key={index} className="mb-2">
                          {parts.map((part, i) => {
                            if (part.match(/^\*\*.*\*\*$/)) {
                              return <strong key={i}>{part.replace(/\*\*/g, "")}</strong>
                            } else if (part.match(/^\*.*\*$/)) {
                              return (
                                <span key={i} className="text-[1.05em]">
                                  {part.replace(/\*/g, "")}
                                </span>
                              )
                            }
                            return <span key={i}>{part}</span>
                          })}
                        </p>
                      )
                    }
                    return <br key={index} />
                  })}
                </div>
              </div>
            )}
            {activeTab === "flashcards" && (
              <>
                <h3 className="text-2xl font-bold mb-6 text-balance">Flashcards de révision</h3>
                <FlashcardSet flashcards={selectedSummary.flashcards} />
              </>
            )}
            {activeTab === "qcm" && selectedSummary.qcm && (
              <>
                <h3 className="text-2xl font-bold mb-6 text-balance">Quiz de révision</h3>
                <QCMDisplay questions={selectedSummary.qcm} />
              </>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-balance">Historique</h2>
        <p className="text-muted-foreground">Retrouvez tous vos résumés et flashcards</p>
      </div>

      {summaries.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucun résumé enregistré pour le moment</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <Card
              key={summary.id}
              className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
              onClick={() => setSelectedSummary(summary)}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    {summary.type === "audio" ? (
                      <Mic className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{summary.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(summary.createdAt)}
                      </p>
                      {summary.subject && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{summary.subject}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{summary.flashcards.length} flashcards</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(summary.id, e)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
