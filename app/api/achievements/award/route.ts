import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Points awarded for each activity type
const POINTS_MAP = {
  summary: 10,
  qcm: 5,
  flashcard: 3,
  todo: 2,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { activityType, description } = body

    if (!activityType || !POINTS_MAP[activityType as keyof typeof POINTS_MAP]) {
      return NextResponse.json({ error: "Type d'activité invalide" }, { status: 400 })
    }

    const pointsEarned = POINTS_MAP[activityType as keyof typeof POINTS_MAP]

    // Get or create user achievements
    let { data: achievements, error: fetchError } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching achievements:", fetchError)
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

      achievements = newAchievements
    }

    // Update achievements based on activity type
    const updates: any = {
      total_points: achievements.total_points + pointsEarned,
      updated_at: new Date().toISOString(),
    }

    if (activityType === "summary") {
      updates.summaries_created = achievements.summaries_created + 1
    } else if (activityType === "qcm") {
      updates.qcm_completed = achievements.qcm_completed + 1
    } else if (activityType === "flashcard") {
      updates.flashcards_reviewed = achievements.flashcards_reviewed + 1
    } else if (activityType === "todo") {
      updates.todos_completed = achievements.todos_completed + 1
    }

    // Update user achievements
    const { error: updateError } = await supabase.from("user_achievements").update(updates).eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating achievements:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour des achievements" }, { status: 500 })
    }

    // Add to points history
    const { error: historyError } = await supabase.from("points_history").insert({
      user_id: user.id,
      points_earned: pointsEarned,
      activity_type: activityType,
      activity_description: description || `${activityType} complété`,
    })

    if (historyError) {
      console.error("Error adding to points history:", historyError)
      // Don't fail the request if history insert fails
    }

    return NextResponse.json({
      success: true,
      pointsEarned,
      totalPoints: updates.total_points,
    })
  } catch (error) {
    console.error("Error in award achievements API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
