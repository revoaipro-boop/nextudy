import { createClient } from "@/lib/supabase/server"

// GET - Get a single book summary
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("book_summaries")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Error fetching book summary:", error)
      return Response.json({ error: "Résumé non trouvé" }, { status: 404 })
    }

    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error in GET /api/book-summaries/[id]:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Delete a book summary
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { error } = await supabase.from("book_summaries").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error deleting book summary:", error)
      return Response.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/book-summaries/[id]:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
