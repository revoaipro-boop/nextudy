import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    console.log("[v0] Starting regeneration request")
    const { summaryId, textContent, type, subject, existingFlashcards, existingQcm } = await req.json()

    if (!summaryId || !textContent || !type) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    if (!["flashcards", "qcm", "both"].includes(type)) {
      return Response.json({ error: "Type invalide" }, { status: 400 })
    }

    const results: {
      flashcards?: Array<{ question: string; answer: string }>
      qcm?: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }>
    } = {}

    // Regenerate flashcards
    if (type === "flashcards" || type === "both") {
      try {
        const existingQuestions = existingFlashcards?.map((f: any) => f.question).join("\n- ") || "Aucune"

        const flashcardPrompt = `Tu es un assistant spécialisé dans la création de flashcards pour la révision en ${subject || "général"}.

🚨 RÈGLE ABSOLUE : Tu dois créer des flashcards COMPLÈTEMENT NOUVELLES et TOTALEMENT DIFFÉRENTES des questions existantes.

QUESTIONS EXISTANTES À ÉVITER ABSOLUMENT :
- ${existingQuestions}

STRATÉGIES OBLIGATOIRES pour créer des questions DIFFÉRENTES :
1. Explore des SECTIONS DIFFÉRENTES du document (début, milieu, fin)
2. Change COMPLÈTEMENT l'angle d'approche :
   - Si existant = définition → nouveau = application pratique
   - Si existant = "Qu'est-ce que" → nouveau = "Pourquoi" ou "Comment"
   - Si existant = concept général → nouveau = exemple spécifique
   - Si existant = cause → nouveau = conséquence
3. Varie les niveaux de difficulté (basique ↔ avancé)
4. Pose des questions sur :
   - Les RELATIONS entre concepts
   - Les COMPARAISONS entre éléments
   - Les APPLICATIONS pratiques
   - Les EXEMPLES concrets
   - Les PROCESSUS et étapes
   - Les AVANTAGES et inconvénients
5. Utilise des formats VARIÉS :
   - "Donnez un exemple de..."
   - "Comparez X et Y..."
   - "Expliquez le processus de..."
   - "Quels sont les avantages de..."
   - "Comment appliquer..."

Tu DOIS créer 6-10 flashcards UNIQUES en français.

Format des flashcards :
- Question : Claire, directe, et TOTALEMENT DIFFÉRENTE des questions existantes
- Réponse : Précise et basée sur le contenu du document

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "flashcards": [
    {"question": "Question totalement nouvelle 1?", "answer": "Réponse 1"},
    {"question": "Question totalement nouvelle 2?", "answer": "Réponse 2"}
  ]
}

Voici le contenu du document :

${textContent}`

        console.log("[v0] Calling AI Gateway for flashcards regeneration")
        const { text: flashcardText } = await generateText({
          model: "google/gemini-2.0-flash", // Switched from OpenAI to Gemini 2.0 Flash
          prompt: flashcardPrompt,
          maxTokens: 1500,
          temperature: 1.0,
        })

        try {
          const jsonMatch = flashcardText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            results.flashcards = parsed.flashcards || []
            console.log("[v0] Successfully regenerated flashcards:", results.flashcards.length)
          }
        } catch (parseError) {
          console.error("[v0] Failed to parse flashcards JSON:", parseError)
          results.flashcards = []
        }
      } catch (error) {
        console.error("[v0] Error regenerating flashcards:", error)
        results.flashcards = []
      }
    }

    if (type === "both" && results.flashcards !== undefined) {
      console.log("[v0] Waiting 1 second before QCM generation")
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Regenerate QCM
    if (type === "qcm" || type === "both") {
      try {
        const existingQuestions = existingQcm?.map((q: any) => q.question).join("\n- ") || "Aucune"

        const qcmPrompt = `Tu es un assistant spécialisé dans la création de QCM (Questions à Choix Multiples) pour la matière: ${subject || "général"}.

🚨 RÈGLE ABSOLUE : Tu dois créer des questions COMPLÈTEMENT NOUVELLES et TOTALEMENT DIFFÉRENTES des questions existantes.

QUESTIONS EXISTANTES À ÉVITER ABSOLUMENT :
- ${existingQuestions}

STRATÉGIES OBLIGATOIRES pour créer des questions DIFFÉRENTES :
1. Explore des SECTIONS DIFFÉRENTES du document
2. Change COMPLÈTEMENT le type de question :
   - Si existant = compréhension → nouveau = analyse ou application
   - Si existant = définition → nouveau = comparaison ou évaluation
   - Si existant = "Quel est" → nouveau = "Pourquoi" ou "Comment"
3. Varie les aspects testés :
   - DÉFINITIONS vs PROCESSUS vs COMPARAISONS
   - CAUSES vs CONSÉQUENCES vs SOLUTIONS
   - THÉORIE vs PRATIQUE vs EXEMPLES
4. Utilise différentes formulations :
   - "Laquelle de ces affirmations..."
   - "Quel est l'avantage principal de..."
   - "Comment peut-on expliquer..."
   - "Quelle est la différence entre..."
   - "Dans quel contexte..."
5. Teste différents niveaux de complexité

Tu DOIS créer 5-8 questions UNIQUES à choix multiples en français.

Format des questions :
- Question claire et TOTALEMENT DIFFÉRENTE des questions existantes
- 4 options de réponse plausibles (dont 1 seule correcte)
- Index de la bonne réponse (0, 1, 2, ou 3)
- Explication courte

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "qcm": [
    {
      "question": "Question totalement nouvelle sur le texte?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "explanation": "Explication de la bonne réponse"
    }
  ]
}

IMPORTANT: correctAnswer doit être un nombre entre 0 et 3.

Voici le contenu du document :

${textContent}`

        console.log("[v0] Calling AI Gateway for QCM regeneration")
        const { text: qcmText } = await generateText({
          model: "google/gemini-2.0-flash", // Switched from OpenAI to Gemini 2.0 Flash
          prompt: qcmPrompt,
          maxTokens: 2000,
          temperature: 0.95,
        })

        try {
          const jsonMatch = qcmText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const cleanedJson = jsonMatch[0]
              .replace(/,(\s*[}\]])/g, "$1")
              .replace(/\n/g, " ")
              .trim()

            const parsed = JSON.parse(cleanedJson)

            if (parsed.qcm && Array.isArray(parsed.qcm) && parsed.qcm.length > 0) {
              results.qcm = parsed.qcm.filter(
                (q: any) =>
                  q.question &&
                  Array.isArray(q.options) &&
                  q.options.length === 4 &&
                  typeof q.correctAnswer === "number" &&
                  q.correctAnswer >= 0 &&
                  q.correctAnswer <= 3,
              )
              console.log("[v0] Successfully regenerated QCM with", results.qcm.length, "valid questions")
            }
          }
        } catch (parseError) {
          console.error("[v0] Failed to parse QCM JSON:", parseError)
          results.qcm = []
        }
      } catch (error) {
        console.error("[v0] Error regenerating QCM:", error)
        results.qcm = []
      }
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Build update object
    const updateData: {
      flashcards?: string
      qcm?: string
      updated_at?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (results.flashcards !== undefined) {
      updateData.flashcards = JSON.stringify(results.flashcards)
    }

    if (results.qcm !== undefined) {
      updateData.qcm = JSON.stringify(results.qcm)
    }

    // Update the summaries table
    const { error: updateError } = await supabase
      .from("summaries")
      .update(updateData)
      .eq("id", summaryId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[v0] Error updating database:", updateError)
      return Response.json({ error: "Erreur lors de la mise à jour de la base de données" }, { status: 500 })
    }

    console.log("[v0] Regeneration complete")
    return Response.json(results)
  } catch (error) {
    console.error("[v0] Error during regeneration:", error)
    return Response.json(
      {
        error: "Erreur lors de la régénération",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
