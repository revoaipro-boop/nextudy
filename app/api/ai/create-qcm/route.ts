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

    const randomSeed = Math.floor(Math.random() * 10000)
    const prompt = `Tu es un assistant spécialisé dans la création de QCM (Questions à Choix Multiples).

GÉNÉRATION #${randomSeed}

Crée 5-8 questions à choix multiples en français basées sur ce document.

Format Markdown pour chaque question :

### Question [N]
[Texte de la question]

**Options :**
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]

**Réponse correcte :** [Lettre]

**Explication :** [Courte explication]

---

RÈGLES :
1. Questions variées (définitions, applications, analyses)
2. 4 options plausibles par question
3. Une seule réponse correcte
4. Explication claire pour chaque réponse

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
        max_tokens: 2500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Groq API error:", response.status, errorText)
      return Response.json({ error: "Erreur lors de la création du QCM" }, { status: 500 })
    }

    const data = await response.json()
    const qcm = data.choices[0]?.message?.content

    if (!qcm) {
      return Response.json({ error: "Aucune réponse de l'IA" }, { status: 500 })
    }

    return Response.json({ qcm })
  } catch (error) {
    console.error("[v0] Error creating QCM:", error)
    return Response.json({ error: "Erreur lors de la création du QCM" }, { status: 500 })
  }
}
