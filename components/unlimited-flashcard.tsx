"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UnlimitedFlashcardProps {
  subject: string
}

interface FlashcardData {
  question: string
  answer: string
}

export function UnlimitedFlashcard({ subject }: UnlimitedFlashcardProps) {
  const [currentFlashcard, setCurrentFlashcard] = useState<FlashcardData | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const [cardCount, setCardCount] = useState(0)
  const [cooldownTime, setCooldownTime] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownTime])

  const generateFlashcard = async () => {
    if (isLoading || cooldownTime > 0) return

    setIsLoading(true)
    setIsFlipped(false) // Always reset to question side when generating new card

    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          previousQuestions,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la génération")
      }

      const data = await response.json()
      setCurrentFlashcard(data.flashcard)
      setPreviousQuestions((prev) => [...prev, data.flashcard.question])
      setCardCount((prev) => prev + 1)
      setCooldownTime(5)
    } catch (error) {
      console.error("Error generating flashcard:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer la flashcard",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generateFlashcard()
  }, [])

  const handleFlip = () => {
    if (!isLoading) {
      setIsFlipped((prev) => !prev)
    }
  }

  const handleNext = () => {
    generateFlashcard()
  }

  if (!currentFlashcard && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Génération de votre première flashcard...</p>
        </div>
      </div>
    )
  }

  if (!currentFlashcard) {
    return null
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/80">
          <span className="font-medium text-white">{cardCount}</span> flashcard{cardCount > 1 ? "s" : ""} générée
          {cardCount > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Sparkles className="h-4 w-4 text-accent" />
          Mode illimité
        </div>
      </div>

      <div className="perspective-1000 w-full h-80">
        <Card
          className="relative h-full cursor-pointer transition-all hover:shadow-lg"
          onClick={handleFlip}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isLoading ? 0.5 : 1,
            pointerEvents: isLoading ? "none" : "auto",
          }}
        >
          {/* Front side - Question */}
          <div
            className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="space-y-4">
              <div className="text-sm font-medium text-primary">Question</div>
              <p className="text-xl font-medium leading-relaxed">{currentFlashcard.question}</p>
              <p className="text-xs text-muted-foreground">Cliquez pour voir la réponse</p>
            </div>
          </div>

          {/* Back side - Answer */}
          <div
            className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="space-y-4">
              <div className="text-sm font-medium text-accent">Réponse</div>
              <p className="text-lg leading-relaxed">{currentFlashcard.answer}</p>
              <p className="text-xs text-muted-foreground">Cliquez pour voir la question</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-center">
        <Button
          onClick={handleNext}
          disabled={isLoading || cooldownTime > 0}
          className="gap-2 px-8 py-6 text-lg"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération...
            </>
          ) : cooldownTime > 0 ? (
            <>Attendre {cooldownTime}s</>
          ) : (
            <>
              Suivant
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {cooldownTime > 0 && (
        <p className="text-center text-sm text-muted-foreground">Cooldown pour éviter les limites de taux de l'API</p>
      )}
    </div>
  )
}
