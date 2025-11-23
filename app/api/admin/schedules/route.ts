import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  return email === adminEmail
}

// GET - List all schedules
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(user.email || ""))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Get all schedules
    const { data: schedules, error } = await supabase
      .from("reminder_schedules")
      .select("*")
      .order("schedule_time", { ascending: true })

    if (error) throw error

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(user.email || ""))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, schedule_time, is_active } = body

    if (!name || !schedule_time) {
      return NextResponse.json({ error: "Nom et heure requis" }, { status: 400 })
    }

    // Insert new schedule
    const { data, error } = await supabase
      .from("reminder_schedules")
      .insert({
        name,
        description,
        schedule_time,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ schedule: data })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Update schedule
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(user.email || ""))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Update schedule
    const { data, error } = await supabase
      .from("reminder_schedules")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ schedule: data })
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Delete schedule
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(user.email || ""))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Delete schedule
    const { error } = await supabase.from("reminder_schedules").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
