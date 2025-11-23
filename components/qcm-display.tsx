"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface QCMQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QCMDisplayProps {
  questions: QCMQuestion[]
}

export function QCMDisplay({ questions }: QCMDisplayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([])
  const [pointsAwarded, setPointsAwarded] = useState(false)
  const { toast } = useToast()

  const awardPoints = async () => {
    if (pointsAwarded) return

    try {
      const response = await fetch("/api/achievements/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: "qcm",
          description: `QCM complété avec un score de ${score}/${questions.length}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPointsAwarded(true)
        toast({
          title: "🎉 Points gagnés !",
          description: `+${data.pointsEarned} points pour avoir complété ce QCM`,
        })
      }
    } catch (error) {
      console.error("Error awarding points:", error)
    }
  }

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return
    setSelectedAnswer(optionIndex)
  }

  const handleSubmit = () => {
    if (selectedAnswer === null) return

    setShowResult(true)
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }
    setAnsweredQuestions([...answeredQuestions, currentQuestion])
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleReset = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnsweredQuestions([])
    setPointsAwarded(false)
  }

  const isLastQuestion = currentQuestion === questions.length - 1
  const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer

  if (isLastQuestion && showResult && !pointsAwarded) {
    awardPoints()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} sur {questions.length}
        </div>
        <div className="text-sm font-medium text-foreground">
          Score: {score}/{answeredQuestions.length}
        </div>
      </div>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-6 leading-relaxed text-foreground">
          {questions[currentQuestion].question}
        </h4>

        <div className="space-y-3 mb-6">
          {questions[currentQuestion].options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectOption = index === questions[currentQuestion].correctAnswer
            const showCorrect = showResult && isCorrectOption
            const showIncorrect = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  showCorrect
                    ? "border-green-500 bg-green-500/10 dark:bg-green-500/20"
                    : showIncorrect
                      ? "border-red-500 bg-red-500/10 dark:bg-red-500/20"
                      : isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-accent/10"
                } ${showResult ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="leading-relaxed text-foreground">{option}</span>
                  {showCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 ml-2" />
                  )}
                  {showIncorrect && <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 ml-2" />}
                </div>
              </button>
            )
          })}
        </div>

        {showResult && questions[currentQuestion].explanation && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <p className="text-sm font-medium text-foreground mb-1">Explication</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{questions[currentQuestion].explanation}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={selectedAnswer === null} className="flex-1">
              Valider
            </Button>
          ) : (
            <>
              {!isLastQuestion ? (
                <Button onClick={handleNext} className="flex-1">
                  Question suivante
                </Button>
              ) : (
                <div className="flex-1 space-y-3">
                  <Card className="p-4 bg-primary/10 border-primary/20">
                    <p className="text-center font-semibold flex items-center justify-center gap-2 text-foreground">
                      <Trophy className="h-5 w-5 text-primary" />
                      Quiz terminé ! Score final: {score}/{questions.length}
                    </p>
                    <p className="text-center text-sm text-muted-foreground mt-1">
                      {score === questions.length
                        ? "Parfait ! 🎉"
                        : score >= questions.length * 0.7
                          ? "Très bien ! 👏"
                          : score >= questions.length * 0.5
                            ? "Pas mal ! 👍"
                            : "Continue à réviser ! 📚"}
                    </p>
                  </Card>
                  <Button onClick={handleReset} variant="outline" className="w-full gap-2 bg-transparent">
                    <RotateCcw className="h-4 w-4" />
                    Recommencer
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-2 justify-center flex-wrap">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentQuestion
                ? "bg-primary scale-125"
                : answeredQuestions.includes(index)
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
