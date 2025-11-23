"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface ProgressBarProps {
  isProcessing: boolean
  stages: string[]
}

export function ProgressBar({ isProcessing, stages }: ProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    if (!isProcessing) {
      setProgress(0)
      setCurrentStage(0)
      return
    }

    const stageProgress = 100 / stages.length
    let currentProgress = 0
    let stageIndex = 0

    const interval = setInterval(() => {
      currentProgress += 1

      if (currentProgress >= (stageIndex + 1) * stageProgress && stageIndex < stages.length - 1) {
        stageIndex++
        setCurrentStage(stageIndex)
      }

      if (currentProgress >= 98) {
        currentProgress = 98
      }

      setProgress(currentProgress)
    }, 300)

    return () => clearInterval(interval)
  }, [isProcessing, stages.length])

  useEffect(() => {
    if (!isProcessing && progress > 0) {
      setProgress(100)
      setCurrentStage(stages.length - 1)
    }
  }, [isProcessing, progress, stages.length])

  if (!isProcessing && progress === 0) return null

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <p className="font-medium text-sm text-foreground">{stages[currentStage]}</p>
          <p className="text-xs text-foreground/70 mt-1">{Math.round(progress)}% complété</p>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </Card>
  )
}
