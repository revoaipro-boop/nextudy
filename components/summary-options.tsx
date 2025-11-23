"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/input"
import { BookOpen, Sparkles, Loader2 } from "lucide-react"

const SUBJECTS = [
  "Mathématiques",
  "Physique",
  "Chimie",
  "Biologie",
  "Histoire",
  "Géographie",
  "Français",
  "Anglais",
  "Philosophie",
  "Économie",
  "Informatique",
  "Autre",
]

export interface SummaryOptionsData {
  subject: string
  customName?: string
  generateLongSummary: boolean
  generateShortSummary: boolean
  generateFlashcards: boolean
  generateQCM: boolean
  editBeforeSummarize: boolean
}

interface SummaryOptionsProps {
  onGenerate: (options: SummaryOptionsData) => void
  onCancel: () => void
  isProcessing: boolean
  fileType?: string
  progress?: number
  progressMessage?: string
  onSubjectChange?: (subject: string) => void
  onSelectionChange?: (hasSelection: boolean) => void
}

export function SummaryOptions({
  onGenerate,
  onCancel,
  isProcessing,
  fileType,
  progress: externalProgress,
  progressMessage: externalMessage,
  onSubjectChange,
  onSelectionChange,
}: SummaryOptionsProps) {
  const [subject, setSubject] = useState<string>("")
  const [customName, setCustomName] = useState<string>("")
  const [generateLongSummary, setGenerateLongSummary] = useState(true)
  const [generateShortSummary, setGenerateShortSummary] = useState(true)
  const [generateFlashcards, setGenerateFlashcards] = useState(true)
  const [generateQCM, setGenerateQCM] = useState(true)
  const [editBeforeSummarize, setEditBeforeSummarize] = useState(false)

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject)
    onSubjectChange?.(newSubject)
  }

  const hasSelection = generateLongSummary || generateShortSummary || generateFlashcards || generateQCM

  useEffect(() => {
    onSelectionChange?.(hasSelection)
  }, [hasSelection, onSelectionChange])

  const handleGenerate = () => {
    if (!subject) {
      console.log("[v0] No subject selected")
      return
    }

    const hasSelection = generateLongSummary || generateShortSummary || generateFlashcards || generateQCM

    if (!hasSelection) {
      console.log("[v0] No generation options selected")
      return
    }

    console.log("[v0] Generating with options:", {
      subject,
      generateLongSummary,
      generateShortSummary,
      generateFlashcards,
      generateQCM,
    })

    onGenerate({
      subject,
      customName,
      generateLongSummary,
      generateShortSummary,
      generateFlashcards,
      generateQCM,
      editBeforeSummarize,
    })
  }

  const displayProgress = externalProgress ?? 0
  const displayMessage = externalMessage ?? "Initialisation de la génération..."
  const showEditButton = fileType === "audio"

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-accent/10 w-10 h-10 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Options de génération</h3>
            <p className="text-sm text-muted-foreground">Personnalisez votre résumé</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Matière
            </Label>
            <Select value={subject} onValueChange={handleSubjectChange}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Sélectionnez une matière" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-name">Nom personnalisé (optionnel)</Label>
            <Input
              id="custom-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Chapitre 3 - La Révolution française"
            />
          </div>

          {showEditButton && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <Checkbox
                id="edit-before"
                checked={editBeforeSummarize}
                onCheckedChange={(checked) => setEditBeforeSummarize(checked as boolean)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="edit-before" className="cursor-pointer font-medium">
                  Éditer le texte avant résumé
                </Label>
                <p className="text-sm text-muted-foreground">
                  Modifiez la transcription de l'audio avant de générer le résumé
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Label className="text-base">Que souhaitez-vous générer ?</Label>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="long-summary"
                  checked={generateLongSummary}
                  onCheckedChange={(checked) => setGenerateLongSummary(checked as boolean)}
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="long-summary" className="cursor-pointer font-medium">
                    Résumé long
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Inclut des informations supplémentaires et du contexte pour faciliter les recherches
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="short-summary"
                  checked={generateShortSummary}
                  onCheckedChange={(checked) => setGenerateShortSummary(checked as boolean)}
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="short-summary" className="cursor-pointer font-medium">
                    Fiche de révision
                  </Label>
                  <p className="text-sm text-muted-foreground">Points-clés structurés pour une révision efficace</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="qcm"
                  checked={generateQCM}
                  onCheckedChange={(checked) => {
                    console.log("[v0] QCM checkbox changed to:", checked)
                    setGenerateQCM(checked as boolean)
                  }}
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="qcm" className="cursor-pointer font-medium">
                    QCM
                  </Label>
                  <p className="text-sm text-muted-foreground">Quiz à choix multiples pour tester vos connaissances</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="flashcards"
                  checked={generateFlashcards}
                  onCheckedChange={(checked) => setGenerateFlashcards(checked as boolean)}
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="flashcards" className="cursor-pointer font-medium">
                    Flashcards
                  </Label>
                  <p className="text-sm text-muted-foreground">Cartes de révision avec questions et réponses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleGenerate} disabled={!subject || !hasSelection || isProcessing} className="flex-1">
          Générer
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Annuler
        </Button>
      </div>

      {isProcessing && (
        <div className="mt-4">
          <div className="w-full bg-black rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <p className="text-sm font-medium text-white">Génération en cours...</p>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500 ease-out"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{displayMessage}</p>
                <span className="text-sm text-zinc-400">{displayProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasSelection && subject && (
        <p className="text-sm text-muted-foreground text-center">
          Veuillez sélectionner au moins une option de génération
        </p>
      )}
    </Card>
  )
}
