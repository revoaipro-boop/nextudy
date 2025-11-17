"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Target, Zap, BookOpen, Brain, CheckCircle2, Sparkles } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { useEffect, useState } from "react"

interface Achievement {
  total_points: number
  summaries_created: number
  qcm_completed: number
  flashcards_reviewed: number
  todos_completed: number
}

interface PointsHistoryItem {
  created_at: string
  points_earned: number
  activity_type: string
}

export function AchievementsGraph() {
  const [achievements, setAchievements] = useState<Achievement | null>(null)
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const response = await fetch("/api/achievements")
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements)
        setPointsHistory(data.pointsHistory || [])
      }
    } catch (error) {
      console.error("Error fetching achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  // Process points history into daily cumulative data for the graph
  const graphData = pointsHistory.reduce(
    (acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })

      const existingDay = acc.find((d) => d.date === date)
      if (existingDay) {
        existingDay.points += item.points_earned
      } else {
        acc.push({
          date,
          points: item.points_earned,
        })
      }

      return acc
    },
    [] as Array<{ date: string; points: number }>,
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!achievements) {
    return null
  }

  const stats = [
    {
      label: "Résumés créés",
      value: achievements.summaries_created,
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "QCM complétés",
      value: achievements.qcm_completed,
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Flashcards révisées",
      value: achievements.flashcards_reviewed,
      icon: Sparkles,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Tâches complétées",
      value: achievements.todos_completed,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Total Points Card */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="h-8 w-8 text-accent" />
                {achievements.total_points} Points
              </CardTitle>
              <CardDescription className="mt-2">Votre niveau d'accomplissement total</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Niveau {Math.floor(achievements.total_points / 50) + 1}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-foreground/70">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Graph */}
      {graphData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Progression des 30 derniers jours
            </CardTitle>
            <CardDescription>Points gagnés chaque jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickMargin={10} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickMargin={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "12px",
                    zIndex: 1000,
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                  cursor={{ fill: "transparent" }}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--accent))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Points gagnés"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {graphData.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
            <p className="text-lg font-medium mb-2">Commencez votre parcours !</p>
            <p className="text-sm text-foreground/70">
              Créez des résumés, complétez des QCM et révisez des flashcards pour gagner des points.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
