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

    const prompt = `Tu es un assistant spécialisé dans la création de fiches de révision.

Analyse ce document et crée une fiche de révision structurée, claire et aérée en français.

Utilise EXACTEMENT ce format Markdown :

## 🧠 Fiche de révision

### I. Points essentiels
- [Point clé 1]
- [Point clé 2]
- [Point clé 3]

### II. Définitions importantes
- **[Terme 1]** : [Définition courte et claire]
- **[Terme 2]** : [Définition courte et claire]
- **[Terme 3]** : [Définition courte et claire]

### III. À retenir
- [Concept ou phrase de synthèse finale]
- [Point important à mémoriser]

La fiche doit être :
- Claire et concise
- Bien hiérarchisée avec des sections distinctes
- Prête à imprimer
- Facile à réviser rapidement

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
        max_tokens: 1500,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Groq API error:", response.status, errorText)
      return Response.json({ error: "Erreur lors de la création de la fiche" }, { status: 500 })
    }

    const data = await response.json()
    const revisionSheet = data.choices[0]?.message?.content

    if (!revisionSheet) {
      return Response.json({ error: "Aucune réponse de l'IA" }, { status: 500 })
    }

    return Response.json({ revisionSheet })
  } catch (error) {
    console.error("[v0] Error creating revision sheet:", error)
    return Response.json({ error: "Erreur lors de la création de la fiche" }, { status: 500 })
  }
}
