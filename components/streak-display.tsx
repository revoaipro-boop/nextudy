"use client"

import { useEffect, useState } from "react"
import { Flame } from "lucide-react"

interface StreakData {
  currentStreak: number
  hasActivityToday: boolean
  recentActivity: Array<{
    streak_date: string
    activity_count: number
  }>
}

export function StreakDisplay() {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStreak()
  }, [])

  const fetchStreak = async () => {
    try {
      const response = await fetch("/api/streak")
      if (response.ok) {
        const data = await response.json()
        setStreakData(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching streak:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 text-muted-foreground text-sm">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  if (!streakData) return null

  const getLast30Days = () => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const hasActivity = streakData.recentActivity.some((activity) => activity.streak_date === dateStr)
      days.push({
        date: dateStr,
        hasActivity,
      })
    }
    return days
  }

  const last30Days = getLast30Days()

  return (
    <div className="flex items-center justify-between gap-6 px-6 py-3 rounded-xl bg-accent/10 text-sm border border-accent/20 w-full max-w-[1000px]">
      <div className="flex items-center gap-2 shrink-0">
        <Flame className="h-5 w-5 text-accent" />
        <span className="font-semibold text-foreground text-base">
          {streakData.currentStreak}{" "}
          {streakData.currentStreak === 0 ? "" : streakData.currentStreak === 1 ? "jour" : "jours"}
        </span>
      </div>

      <div className="flex gap-2 flex-1 justify-center">
        {last30Days.map((day, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              day.hasActivity ? "bg-accent scale-110" : "bg-foreground/20"
            }`}
            title={day.date}
          />
        ))}
      </div>
    </div>
  )
}
