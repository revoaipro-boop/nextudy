import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    // Get current streak using the database function
    const { data: streakData, error: streakError } = await supabase.rpc("get_current_streak", {
      p_user_id: user.id,
    })

    if (streakError) throw streakError

    // Get today's activity
    const today = new Date().toISOString().split("T")[0]
    const { data: todayActivity } = await supabase
      .from("daily_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("streak_date", today)
      .maybeSingle()

    // Get last 7 days of activity
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: recentActivity } = await supabase
      .from("daily_streaks")
      .select("*")
      .eq("user_id", user.id)
      .gte("streak_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("streak_date", { ascending: false })

    return NextResponse.json({
      currentStreak: streakData || 0,
      hasActivityToday: !!todayActivity,
      recentActivity: recentActivity || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching streak:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de la série" }, { status: 500 })
  }
}

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().split("T")[0]

    // Insert or update today's streak
    const { error } = await supabase
      .from("daily_streaks")
      .upsert(
        {
          user_id: user.id,
          streak_date: today,
          activity_count: 1,
        },
        {
          onConflict: "user_id,streak_date",
        },
      )
      .select()

    if (error) throw error

    // Get updated streak
    const { data: streakData } = await supabase.rpc("get_current_streak", {
      p_user_id: user.id,
    })

    return NextResponse.json({
      success: true,
      currentStreak: streakData || 1,
    })
  } catch (error) {
    console.error("[v0] Error updating streak:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de la série" }, { status: 500 })
  }
}
