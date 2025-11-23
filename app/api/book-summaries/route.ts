import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

// GET - Search and list book summaries
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")

    let query = supabase
      .from("book_summaries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`book_title.ilike.%${search}%,author.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching book summaries:", error)
      return Response.json({ error: "Erreur lors de la récupération des résumés" }, { status: 500 })
    }

    return Response.json({ summaries: data })
  } catch (error) {
    console.error("[v0] Error in GET /api/book-summaries:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create a new book summary
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const { bookTitle, author, isbn, summary, keyPoints, themes, characters, quotes, rating, notes, useAI } = body

    if (!bookTitle || !summary) {
      return Response.json({ error: "Titre et résumé requis" }, { status: 400 })
    }

    let finalSummary = summary
    let finalKeyPoints = keyPoints
    let finalThemes = themes

    // If useAI is true, generate enhanced summary with AI
    if (useAI && summary) {
      const apiKey = process.env.GROQ_API_KEY
      if (apiKey) {
        try {
          const aiPrompt = `Tu es un assistant spécialisé dans l'analyse littéraire.

Analyse ce résumé de livre et améliore-le en créant :
1. Un résumé structuré et détaillé
2. Une liste de 5-8 points clés
3. Une liste de 3-5 thèmes principaux

Livre : ${bookTitle}
${author ? `Auteur : ${author}` : ""}

Résumé fourni :
${summary}

Réponds UNIQUEMENT avec un JSON valide dans ce format :
{
  "summary": "Résumé amélioré et structuré",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "themes": ["Thème 1", "Thème 2", "Thème 3"]
}`

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: aiPrompt }],
              max_tokens: 2000,
              temperature: 0.4,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const aiText = data.choices[0]?.message?.content || ""
            const jsonMatch = aiText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              finalSummary = parsed.summary || summary
              finalKeyPoints = parsed.keyPoints || keyPoints
              finalThemes = parsed.themes || themes
            }
          }
        } catch (aiError) {
          console.error("[v0] AI enhancement failed:", aiError)
          // Continue with original data if AI fails
        }
      }
    }

    const { data, error } = await supabase
      .from("book_summaries")
      .insert({
        user_id: user.id,
        book_title: bookTitle,
        author: author || null,
        isbn: isbn || null,
        summary: finalSummary,
        key_points: finalKeyPoints || [],
        themes: finalThemes || [],
        characters: characters || null,
        quotes: quotes || [],
        rating: rating || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating book summary:", error)
      return Response.json({ error: "Erreur lors de la création du résumé" }, { status: 500 })
    }

    return Response.json({ summary: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/book-summaries:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
