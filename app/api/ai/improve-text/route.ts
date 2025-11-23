export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length === 0) {
      return Response.json({ error: "Aucun texte fourni" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Configuration manquante: GROQ_API_KEY requis" }, { status: 500 })
    }

    const prompt = `Tu es un assistant spécialisé dans l'amélioration de textes académiques.

Analyse ce texte et améliore-le en :
1. Corrigeant les fautes d'orthographe et de grammaire
2. Améliorant la clarté et la fluidité
3. Enrichissant le vocabulaire quand c'est pertinent
4. Gardant le même sens et la même structure générale
5. Conservant le format Markdown si présent

IMPORTANT : Retourne UNIQUEMENT le texte amélioré, sans commentaires ni explications.

Texte à améliorer :

${text}`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Groq API error:", response.status, errorText)
      return Response.json({ error: "Erreur lors de l'amélioration du texte" }, { status: 500 })
    }

    const data = await response.json()
    const improvedText = data.choices[0]?.message?.content

    if (!improvedText) {
      return Response.json({ error: "Aucune réponse de l'IA" }, { status: 500 })
    }

    return Response.json({ improvedText })
  } catch (error) {
    console.error("[v0] Error improving text:", error)
    return Response.json({ error: "Erreur lors de l'amélioration du texte" }, { status: 500 })
  }
}
