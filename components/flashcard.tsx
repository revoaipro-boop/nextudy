"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCw, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FlashcardProps {
  question: string
  answer: string
  isFlipped: boolean
  onFlip: () => void
  isTransitioning: boolean
}

export interface FlashcardData {
  question: string
  answer: string
}

interface FlashcardSetProps {
  flashcards: FlashcardData[]
}

function SingleFlashcard({ question, answer, isFlipped, onFlip, isTransitioning }: FlashcardProps) {
  return (
    <div className="perspective-1000 w-full h-64">
      <Card
        className="relative h-full cursor-pointer transition-all hover:shadow-lg preserve-3d"
        onClick={onFlip}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isTransitioning ? 0 : 1,
          pointerEvents: isTransitioning ? "none" : "auto",
        }}
      >
        <div
          className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            visibility: isFlipped ? "hidden" : "visible",
          }}
        >
          <div className="space-y-4">
            <div className="text-sm font-medium text-primary">Question</div>
            <p className="text-lg font-medium leading-relaxed text-foreground">{question}</p>
            <p className="text-xs text-foreground/60">Cliquez pour voir la réponse</p>
          </div>
        </div>

        <div
          className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            visibility: isFlipped ? "visible" : "hidden",
          }}
        >
          <div className="space-y-4">
            <div className="text-sm font-medium text-accent">Réponse</div>
            <p className="text-base leading-relaxed text-foreground">{answer}</p>
            <p className="text-xs text-foreground/60">Cliquez pour voir la question</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function FlashcardSet({ flashcards }: FlashcardSetProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set())
  const [pointsAwarded, setPointsAwarded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  const handleFlip = () => {
    if (!isTransitioning) {
      setIsFlipped((prev) => {
        const newFlipped = !prev
        if (newFlipped && !reviewedCards.has(currentIndex)) {
          const newReviewed = new Set(reviewedCards)
          newReviewed.add(currentIndex)
          setReviewedCards(newReviewed)
        }
        return newFlipped
      })
    }
  }

  useEffect(() => {
    const awardPoints = async () => {
      if (reviewedCards.size === flashcards.length && !pointsAwarded && flashcards.length > 0) {
        try {
          const response = await fetch("/api/achievements/award", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activityType: "flashcard",
              description: `${flashcards.length} flashcards révisées`,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setPointsAwarded(true)
            toast({
              title: "🎉 Points gagnés !",
              description: `+${data.pointsEarned} points pour avoir révisé toutes les flashcards`,
            })
          }
        } catch (error) {
          console.error("Error awarding points:", error)
        }
      }
    }

    awardPoints()
  }, [reviewedCards, flashcards.length, pointsAwarded, toast])

  const goToNext = () => {
    setIsTransitioning(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  const goToPrevious = () => {
    setIsTransitioning(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  const resetToStart = () => {
    setIsTransitioning(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex(0)
      setReviewedCards(new Set())
      setPointsAwarded(false)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  if (flashcards.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground/70">
          Carte {currentIndex + 1} sur {flashcards.length}
          {reviewedCards.size > 0 && (
            <span className="ml-2 text-accent">
              ({reviewedCards.size}/{flashcards.length} révisées)
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={resetToStart} className="gap-2">
          <RotateCw className="h-4 w-4" />
          Recommencer
        </Button>
      </div>

      {reviewedCards.size === flashcards.length && flashcards.length > 0 && (
        <Card className="p-4 bg-accent/10 border-accent/20">
          <p className="text-center font-semibold flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Toutes les flashcards révisées ! 🎉
          </p>
        </Card>
      )}

      <SingleFlashcard
        question={flashcards[currentIndex].question}
        answer={flashcards[currentIndex].answer}
        isFlipped={isFlipped}
        onFlip={handleFlip}
        isTransitioning={isTransitioning}
      />

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={flashcards.length <= 1}
          className="gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>
        <Button variant="outline" onClick={goToNext} disabled={flashcards.length <= 1} className="gap-2 bg-transparent">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
