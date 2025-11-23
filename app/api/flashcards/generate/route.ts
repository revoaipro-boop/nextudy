export const maxDuration = 60

async function retryWithBackoff(fn: () => Promise<Response>, maxRetries = 4): Promise<Response> {
  const delays = [3000, 6000, 12000, 24000]

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn()

      if (response.status === 429) {
        const errorText = await response.text()
        const errorData = JSON.parse(errorText)

        const retryMatch = errorData.error?.message?.match(/try again in ([\d.]+)s/)
        const retryAfter = retryMatch ? Number.parseFloat(retryMatch[1]) * 1000 : delays[i]

        if (i < maxRetries - 1) {
          console.log(`[v0] Rate limited, waiting ${retryAfter}ms before retry ${i + 1}/${maxRetries}`)
          await new Promise((resolve) => setTimeout(resolve, retryAfter))
          continue
        }
      }

      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delays[i]))
    }
  }

  throw new Error("Max retries exceeded")
}

export async function POST(req: Request) {
  try {
    const { subject, previousQuestions } = await req.json()

    if (!subject || subject.trim().length === 0) {
      return Response.json({ error: "Le sujet est requis" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return Response.json({ error: "Configuration manquante: GROQ_API_KEY requis" }, { status: 500 })
    }

    const previousQuestionsText =
      previousQuestions && previousQuestions.length > 0
        ? `\n\nQUESTIONS DÉJÀ POSÉES (À ÉVITER ABSOLUMENT) :\n${previousQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`
        : ""

    const flashcardPrompt = `Tu es un assistant spécialisé dans la création de flashcards éducatives SIMPLES.

SUJET : ${subject}

MISSION : Crée UNE SEULE flashcard simple avec UNE question et UNE réponse courte.

RÈGLES STRICTES :
1. UNE SEULE question claire et directe
2. UNE SEULE réponse concise (1-2 phrases maximum)
3. Pas de questions multiples ou composées
4. Pas de listes à puces dans la réponse
5. Question différente des précédentes
6. Niveau adapté pour révision rapide
${previousQuestionsText}

EXEMPLES DE BONNES FLASHCARDS :
Question: "Quelle est la capitale de la France ?"
Réponse: "Paris"

Question: "Qui a écrit Les Misérables ?"
Réponse: "Victor Hugo"

Question: "Quelle est la formule de l'eau ?"
Réponse: "H2O"

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "question": "Une question simple et directe ?",
  "answer": "Une réponse courte et précise"
}

IMPORTANT : Reste SIMPLE et CONCIS !`

    console.log("[v0] Generating flashcard for subject:", subject)

    const response = await retryWithBackoff(() =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: flashcardPrompt }],
          max_tokens: 300,
          temperature: 0.9,
        }),
      }),
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Groq API error:", response.status, errorText)
      return Response.json(
        { error: "Erreur lors de la génération de la flashcard", details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    const flashcardText = data.choices[0]?.message?.content || ""

    try {
      const jsonMatch = flashcardText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.question && parsed.answer) {
          console.log("[v0] Successfully generated flashcard")
          return Response.json({ flashcard: parsed })
        }
      }

      console.error("[v0] Invalid flashcard format")
      return Response.json({ error: "Format de flashcard invalide" }, { status: 500 })
    } catch (parseError) {
      console.error("[v0] Failed to parse flashcard JSON:", parseError)
      return Response.json({ error: "Erreur de parsing de la flashcard" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error generating flashcard:", error)
    return Response.json(
      {
        error: "Erreur lors de la génération de la flashcard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
