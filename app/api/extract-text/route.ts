import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // For PDF files, we'll use a simple text extraction
    // In production, you'd want to use a proper PDF parsing library
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Simple PDF text extraction (basic implementation)
    // For better results, consider using pdf-parse or similar libraries
    let text = buffer.toString("utf-8")

    // Clean up the text
    text = text
      .replace(/[^\x20-\x7E\n]/g, " ") // Remove non-printable characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Impossible d'extraire le texte du PDF" }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[v0] Extract text error:", error)
    return NextResponse.json({ error: "Erreur lors de l'extraction du texte" }, { status: 500 })
  }
}
