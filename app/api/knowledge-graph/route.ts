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

    // Fetch knowledge nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("knowledge_nodes")
      .select("*")
      .eq("user_id", user.id)
      .order("mastery_level", { ascending: false })

    if (nodesError) {
      console.error("Error fetching knowledge nodes:", nodesError)
      return NextResponse.json({ error: "Erreur lors de la récupération des nœuds" }, { status: 500 })
    }

    // Fetch connections
    const { data: connections, error: connectionsError } = await supabase
      .from("knowledge_connections")
      .select("*")
      .eq("user_id", user.id)

    if (connectionsError) {
      console.error("Error fetching connections:", connectionsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des connexions" }, { status: 500 })
    }

    return NextResponse.json({ nodes: nodes || [], connections: connections || [] })
  } catch (error) {
    console.error("Error in knowledge graph API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
