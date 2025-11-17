import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { moodScore, energyLevel, focusLevel } = await request.json()

    // Determine session type based on scores
    const avgScore = (moodScore + energyLevel + focusLevel) / 3
    let sessionType: "chill" | "performance" | "stressed"

    if (avgScore <= 2) {
      sessionType = "stressed"
    } else if (avgScore >= 4) {
      sessionType = "performance"
    } else {
      sessionType = "chill"
    }

    // Create revision session
    const { data, error } = await supabase
      .from("revision_sessions")
      .insert({
        user_id: user.id,
        session_type: sessionType,
        mood_score: moodScore,
        energy_level: energyLevel,
        focus_level: focusLevel,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating revision session:", error)
      return NextResponse.json({ error: "Erreur lors de la création de la session" }, { status: 500 })
    }

    return NextResponse.json({ sessionId: data.id, sessionType })
  } catch (error) {
    console.error("Error in adaptive revision start:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
