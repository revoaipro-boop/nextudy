"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wind, Heart } from "lucide-react"

interface BreathingExerciseProps {
  onComplete: () => void
}

export function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale")
  const [count, setCount] = useState(4)
  const [cycle, setCycle] = useState(0)
  const totalCycles = 3

  useEffect(() => {
    if (cycle >= totalCycles) return

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === "inhale") {
            setPhase("hold")
            return 4
          } else if (phase === "hold") {
            setPhase("exhale")
            return 4
          } else {
            // Complete one cycle
            setCycle((c) => c + 1)
            setPhase("inhale")
            return 4
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, cycle])

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return "Inspirez profondément"
      case "hold":
        return "Retenez votre souffle"
      case "exhale":
        return "Expirez lentement"
    }
  }

  const getPhaseColor = () => {
    switch (phase) {
      case "inhale":
        return "bg-blue-500"
      case "hold":
        return "bg-purple-500"
      case "exhale":
        return "bg-green-500"
    }
  }

  if (cycle >= totalCycles) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-6">
          <Heart className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Excellent travail ! 🎉</h2>
          <p className="text-foreground/70">
            Vous avez terminé l'exercice de respiration. Vous devriez vous sentir plus calme et concentré.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-foreground/60">
            💡 <strong>Conseil :</strong> Prenez quelques instants pour vous étirer avant de reprendre vos révisions.
          </p>
          <Button onClick={onComplete} size="lg" className="w-full">
            Continuer mes révisions
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <Wind className="h-12 w-12 text-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exercice de respiration guidée</h2>
        <p className="text-foreground/70">Prenez 15 secondes pour vous détendre</p>
      </div>

      <div className="relative">
        <div className="text-center mb-8">
          <div
            className={`w-32 h-32 mx-auto rounded-full ${getPhaseColor()} flex items-center justify-center text-white text-4xl font-bold transition-all duration-1000 ${
              phase === "inhale" ? "scale-125" : phase === "exhale" ? "scale-75" : "scale-100"
            }`}
          >
            {count}
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-2xl font-semibold">{getPhaseText()}</p>
          <p className="text-foreground/60">
            Cycle {cycle + 1} sur {totalCycles}
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-accent/10 rounded-lg border border-accent/20">
        <p className="text-sm text-center text-foreground/70">
          💙 La respiration profonde aide à réduire le stress et améliore la concentration
        </p>
      </div>
    </Card>
  )
}
