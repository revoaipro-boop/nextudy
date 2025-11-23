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

    const prompt = `Tu es un assistant spécialisé dans la création de résumés académiques.

Analyse ce document et crée un résumé structuré en français.

Utilise le format Markdown avec :
- ## Titre du résumé
- ### Sous-sections si nécessaire
- Listes à puces pour les points importants
- **Gras** pour les concepts clés

Le résumé doit :
1. Capturer les idées principales
2. Être clair et concis
3. Conserver les informations essentielles
4. Être bien structuré et facile à lire

Voici le contenu du document :

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
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Groq API error:", response.status, errorText)
      return Response.json({ error: "Erreur lors de la génération du résumé" }, { status: 500 })
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content

    if (!summary) {
      return Response.json({ error: "Aucune réponse de l'IA" }, { status: 500 })
    }

    return Response.json({ summary })
  } catch (error) {
    console.error("[v0] Error generating summary:", error)
    return Response.json({ error: "Erreur lors de la génération du résumé" }, { status: 500 })
  }
}
