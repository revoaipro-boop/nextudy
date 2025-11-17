"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Heart, Zap, Wind, Music, Timer } from "lucide-react"
import { useRouter } from "next/navigation"
import { BreathingExercise } from "@/components/breathing-exercise"
import type { QCMQuestion } from "@/components/qcm-display"

type RevisionMode = "chill" | "performance" | "stressed" | null

export default function AdaptiveRevisionPage() {
  const router = useRouter()
  const [mode, setMode] = useState<RevisionMode>(null)
  const [showBreathing, setShowBreathing] = useState(false)
  const [moodScore, setMoodScore] = useState(3)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [focusLevel, setFocusLevel] = useState(3)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [questions, setQuestions] = useState<QCMQuestion[]>([])
  const [responseTime, setResponseTime] = useState<number[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Detect mode based on user input
  useEffect(() => {
    if (!sessionStarted) return

    const avgMood = (moodScore + energyLevel + focusLevel) / 3

    if (avgMood <= 2) {
      setMode("stressed")
      setShowBreathing(true)
    } else if (avgMood >= 4) {
      setMode("performance")
    } else {
      setMode("chill")
    }
  }, [moodScore, energyLevel, focusLevel, sessionStarted])

  const startSession = async () => {
    setSessionStarted(true)

    // Create session in database
    try {
      const response = await fetch("/api/adaptive-revision/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodScore,
          energyLevel,
          focusLevel,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.sessionId)
      }
    } catch (error) {
      console.error("Error starting session:", error)
    }
  }

  const getModeConfig = () => {
    switch (mode) {
      case "chill":
        return {
          title: "Mode Chill 😌",
          description: "Révision détendue avec questions simplifiées",
          color: "bg-blue-500",
          icon: <Music className="h-6 w-6" />,
          difficulty: "easy",
        }
      case "performance":
        return {
          title: "Mode Performance 🚀",
          description: "Révision intensive avec timer et questions difficiles",
          color: "bg-red-500",
          icon: <Zap className="h-6 w-6" />,
          difficulty: "hard",
        }
      case "stressed":
        return {
          title: "Mode Détente 🧘",
          description: "Prenez une pause, respirez profondément",
          color: "bg-purple-500",
          icon: <Wind className="h-6 w-6" />,
          difficulty: "easy",
        }
      default:
        return null
    }
  }

  const config = getModeConfig()

  if (!sessionStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-accent" />
            Révision Adaptative Émotionnelle
          </h1>
          <p className="text-foreground/70">
            L'IA détecte votre état émotionnel et adapte automatiquement votre mode de révision
          </p>
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">Comment vous sentez-vous aujourd'hui ?</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Humeur
                </label>
                <span className="text-sm text-foreground/70">{moodScore}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-foreground/60 mt-1">
                <span>Fatigué</span>
                <span>Excellent</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Énergie
                </label>
                <span className="text-sm text-foreground/70">{energyLevel}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-foreground/60 mt-1">
                <span>Épuisé</span>
                <span>Plein d'énergie</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Concentration
                </label>
                <span className="text-sm text-foreground/70">{focusLevel}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={focusLevel}
                onChange={(e) => setFocusLevel(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-foreground/60 mt-1">
                <span>Distrait</span>
                <span>Très concentré</span>
              </div>
            </div>
          </div>

          <Button onClick={startSession} className="w-full mt-8" size="lg">
            Commencer la révision adaptative
          </Button>
        </Card>
      </div>
    )
  }

  if (showBreathing && mode === "stressed") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BreathingExercise onComplete={() => setShowBreathing(false)} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {config && (
        <Card className={`p-6 mb-6 ${config.color} text-white`}>
          <div className="flex items-center gap-4">
            {config.icon}
            <div>
              <h2 className="text-2xl font-bold">{config.title}</h2>
              <p className="text-white/90">{config.description}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Votre session de révision</h3>
        <p className="text-foreground/70 mb-6">
          Le mode {config?.title} est activé. Les questions sont adaptées à votre état actuel.
        </p>

        {mode === "performance" && (
          <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-5 w-5 text-accent" />
              <span className="font-medium">Mode Performance activé</span>
            </div>
            <p className="text-sm text-foreground/70">
              Questions plus difficiles avec timer pour maximiser votre apprentissage
            </p>
          </div>
        )}

        {mode === "chill" && (
          <div className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Mode Chill activé</span>
            </div>
            <p className="text-sm text-foreground/70">Révision détendue à votre rythme, sans pression</p>
          </div>
        )}

        <div className="text-center py-12">
          <p className="text-foreground/60 mb-4">Sélectionnez un sujet pour commencer votre révision adaptative</p>
          <Button onClick={() => router.push("/")}>Choisir un sujet</Button>
        </div>
      </Card>
    </div>
  )
}
