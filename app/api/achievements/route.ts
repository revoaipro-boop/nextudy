import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Get user achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (achievementsError && achievementsError.code !== "PGRST116") {
      console.error("Error fetching achievements:", achievementsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des achievements" }, { status: 500 })
    }

    // If no achievements exist, create them
    if (!achievements) {
      const { data: newAchievements, error: createError } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          total_points: 0,
          summaries_created: 0,
          qcm_completed: 0,
          flashcards_reviewed: 0,
          todos_completed: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating achievements:", createError)
        return NextResponse.json({ error: "Erreur lors de la création des achievements" }, { status: 500 })
      }

      return NextResponse.json({
        achievements: newAchievements,
        pointsHistory: [],
      })
    }

    // Get points history for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: pointsHistory, error: historyError } = await supabase
      .from("points_history")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    if (historyError) {
      console.error("Error fetching points history:", historyError)
      return NextResponse.json({ error: "Erreur lors de la récupération de l'historique" }, { status: 500 })
    }

    return NextResponse.json({
      achievements,
      pointsHistory: pointsHistory || [],
    })
  } catch (error) {
    console.error("Error in achievements API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
