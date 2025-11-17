import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the summary from the database
    const { data: summary, error } = await supabase
      .from("summaries")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error || !summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 })
    }

    // Transform keywords from array to object format if needed
    const transformedKeywords = summary.keywords
      ? Array.isArray(summary.keywords) && typeof summary.keywords[0] === "string"
        ? summary.keywords.map((k: string) => ({ term: k, definition: "" }))
        : summary.keywords
      : []

    return NextResponse.json({
      ...summary,
      keywords: transformedKeywords,
    })
  } catch (error) {
    console.error("[v0] Error fetching summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
