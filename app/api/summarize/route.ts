export const maxDuration = 60

import { generateText } from "ai"

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 2000,
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If rate limited, wait and retry
      if (response.status === 429) {
        const errorBody = await response.text()
        console.log(`[v0] Rate limit hit (attempt ${attempt + 1}/${maxRetries}):`, errorBody)

        // Try to extract wait time from error message
        const waitTimeMatch = errorBody.match(/try again in ([\d.]+)s/)
        const waitTime = waitTimeMatch
          ? Number.parseFloat(waitTimeMatch[1]) * 1000
          : initialDelay * Math.pow(2, attempt)

        if (attempt < maxRetries - 1) {
          console.log(`[v0] Waiting ${Math.round(waitTime)}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        console.log(`[v0] Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

async function extractTextFromWord(base64Data: string, mediaType: string): Promise<string> {
  try {
    const mammoth = (await import("mammoth")).default
    const buffer = Buffer.from(base64Data, "base64")
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error("[v0] Error parsing Word document:", error)
    throw new Error("Impossible d'extraire le texte du document Word. Le fichier est peut-être corrompu.")
  }
}

async function extractTextFromRTF(base64Data: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, "base64")
    const text = buffer.toString("utf-8")

    // Simple RTF text extraction (removes RTF control words)
    const cleanText = text
      .replace(/\\[a-z]+(-?\d+)?[ ]?/g, "") // Remove RTF control words
      .replace(/[{}]/g, "") // Remove braces
      .replace(/\\/g, "") // Remove backslashes
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    return cleanText
  } catch (error) {
    console.error("[v0] Error parsing RTF:", error)
    throw new Error("Impossible d'extraire le texte du fichier RTF.")
  }
}

async function extractTextFromImage(base64Data: string, mediaType: string): Promise<string> {
  try {
    console.log("[v0] Extracting text from image using Gemini vision")

    const { text } = await generateText({
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse cette image et extrais tout le texte visible. Si c'est un document, une photo de cours, un tableau ou tout contenu éducatif, décris également le contenu de manière structurée. Réponds uniquement avec le texte extrait et la description du contenu, sans commentaire additionnel.",
            },
            {
              type: "image",
              image: base64Data,
              mimeType: mediaType,
            },
          ],
        },
      ],
      maxTokens: 2000,
      temperature: 0.3,
    })

    console.log("[v0] Successfully extracted text from image, length:", text.length)
    return text
  } catch (error) {
    console.error("[v0] Error extracting text from image:", error)
    throw new Error("Erreur lors de l'analyse de l'image avec l'IA")
  }
}

export async function POST(req: Request) {
  try {
    console.log("[v0] Starting summarize request")
    const { file, options } = await req.json()
    console.log("[v0] Received file data:", {
      hasText: !!file?.text,
      hasData: !!file?.data,
      mediaType: file?.mediaType,
      filename: file?.filename,
    })
    console.log("[v0] Options:", options)

    if (!file || (!file.data && !file.text)) {
      console.log("[v0] No file provided")
      return Response.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    const sendProgress = async (step: string, progress: number) => {
      const data = JSON.stringify({ type: "progress", step, progress })
      await writer.write(encoder.encode(`data: ${data}\n\n`))
    }

    // Start processing in the background
    ;(async () => {
      try {
        await sendProgress("Extraction du contenu", 5)

        let textContent = file.text

        if (file.data && !textContent) {
          const isImage = file.mediaType?.startsWith("image/") || file.filename?.match(/\.(jpg|jpeg|png|webp)$/i)

          if (isImage) {
            console.log("[v0] Processing image file with vision AI")
            await sendProgress("Analyse de l'image avec l'IA", 10)
            textContent = await extractTextFromImage(file.data, file.mediaType)
            console.log("[v0] Extracted text from image, length:", textContent.length)
          } else if (
            file.mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.mediaType === "application/msword" ||
            file.filename?.endsWith(".docx") ||
            file.filename?.endsWith(".doc")
          ) {
            console.log("[v0] Extracting text from Word document")
            await sendProgress("Extraction du texte du document Word", 10)
            textContent = await extractTextFromWord(file.data, file.mediaType)
            console.log("[v0] Extracted text length:", textContent.length)
          } else if (file.mediaType === "application/rtf" || file.filename?.endsWith(".rtf")) {
            console.log("[v0] Extracting text from RTF")
            await sendProgress("Extraction du texte RTF", 10)
            textContent = await extractTextFromRTF(file.data)
            console.log("[v0] Extracted text length:", textContent.length)
          }
        }

        if (!textContent || textContent.trim().length === 0) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Impossible d'extraire du contenu du fichier" })}\n\n`,
            ),
          )
          await writer.close()
          return
        }

        console.log("[v0] Text content length:", textContent.length)

        const results: {
          summary?: string
          shortSummary?: string
          keywords?: Array<{ term: string; definition: string }>
          flashcards?: Array<{ question: string; answer: string }>
          qcm?: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }>
        } = {}

        // Count total tasks
        const totalTasks =
          (options?.generateLongSummary ? 1 : 0) +
          (options?.generateShortSummary ? 1 : 0) +
          (options?.generateKeywords ? 1 : 0) +
          (options?.generateFlashcards ? 1 : 0) +
          (options?.generateQCM ? 1 : 0)

        let completedTasks = 0

        if (options?.generateLongSummary) {
          await sendProgress("Génération du résumé détaillé", 15 + (completedTasks * 70) / totalTasks)
          try {
            const summaryPrompt = `Tu es un expert pédagogique.
Ton rôle:
1) produire un résumé extrêmement détaillé, clair et structuré du cours
2) produire une fiche de révision courte, hiérarchisée et mémorisable

=== RÈGLES GÉNÉRALES ===
- Analyse le contenu fourni (texte, transcription audio, OCR, PDF).
- Aucune invention d'informations non présentes.
- Reformulations autorisées pour améliorer clarté et logique.
- Retire les redites, préserve l'essentiel.
- Donne une structure stricte.
- Pas de style littéraire. Rédaction claire et factuelle.

======================================================
1) RÉSUMÉ EXTRÊMEMENT DÉTAILLÉ
======================================================
Objectif: Représentation exhaustive et organisée du cours.
Ce n'est PAS un résumé court.

Structure obligatoire:
- Titre du thème
- Objectif / idée centrale
- Sections numérotées hiérarchisées:
    1. Concepts majeurs
        - Définitions
        - Idées clés
        - Exemples concrets
    2. Processus / Méthodes
        - Étapes détaillées
        - Conditions / variantes
    3. Données importantes
        - Dates
        - Chiffres
        - Formules
    4. Applications
        - Usages
        - Cas pratiques
    5. Pièges et confusions fréquentes
    6. Points essentiels à retenir
- Utilise tableaux ou listes si utile.
- Développe les raisonnements.
- Conserve toutes les informations pertinentes du cours.

**Style de formatage** :
- Utilise des émojis uniquement en début de ligne pour les titres (max 5 émojis dans tout le document)
- Alterne entre listes, tableaux et citations
- Mets en **gras** les concepts importants
- Utilise *l'italique* pour les nuances
- Crée des paragraphes aérés
- Utilise des blockquotes (>) pour les définitions importantes

Voici le contenu du document :

${textContent}`

            console.log("[v0] Calling Gemini AI for structured content")
            const { text } = await generateText({
              model: "google/gemini-2.0-flash",
              prompt: summaryPrompt,
              maxTokens: 2500,
              temperature: 0.3,
            })

            results.summary = text
            console.log("[v0] Successfully generated structured content, length:", results.summary.length)
          } catch (error) {
            console.error("[v0] Error generating structured content:", error)
            throw error
          }
          completedTasks++
          await sendProgress("Résumé détaillé terminé", 15 + (completedTasks * 70) / totalTasks)
        }

        if (options?.generateShortSummary) {
          await sendProgress("Génération de la fiche de révision", 15 + (completedTasks * 70) / totalTasks)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          try {
            const shortSummaryPrompt = `Tu es un expert pédagogique.

======================================================
2) FICHE DE RÉVISION COURTE
======================================================
Objectif: version synthétique, mémorisable.

Structure obligatoire:
- Titre
- Mots-clés (5 à 12)
- Idées principales (maximum 8 points)
- Définitions clés
- Formules / dates essentielles
- Mini-exemples
- Résumé final: 3 à 5 phrases

**Style de formatage** :
- Utilise des émojis uniquement en début de ligne pour les titres (max 3 émojis dans tout le document)
- Alterne entre tableaux, listes et citations
- Mets en **gras** les termes importants
- Reste concis : la fiche doit tenir sur une page A4
- Adopte un ton pédagogique et encourageant

Voici le contenu du document :

${textContent}`

            console.log("[v0] Calling Gemini AI for revision sheet")
            const { text } = await generateText({
              model: "google/gemini-2.0-flash",
              prompt: shortSummaryPrompt,
              maxTokens: 1000,
              temperature: 0.3,
            })

            results.shortSummary = text
            console.log("[v0] Successfully generated revision sheet")
          } catch (error) {
            console.error("[v0] Error generating revision sheet:", error)
          }
          completedTasks++
          await sendProgress("Fiche de révision terminée", 15 + (completedTasks * 70) / totalTasks)
        }

        if (options?.generateKeywords) {
          await sendProgress("Génération des mots-clés", 15 + (completedTasks * 70) / totalTasks)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          try {
            const keywordsPrompt = `Tu es un assistant spécialisé dans l'identification de mots-clés pour la matière: ${options.subject}.

TU DOIS OBLIGATOIREMENT analyser ce document et identifier 8-12 mots-clés et concepts importants, MÊME SI le texte est court ou simple.

RÈGLES ABSOLUES :
1. TU DOIS TOUJOURS générer des mots-clés, peu importe le contenu
2. Si le texte est une introduction personnelle, identifie les noms, lieux, sentiments, actions mentionnés
3. Si le texte est court, identifie TOUS les mots significatifs présents
4. Les définitions doivent expliquer le sens ou le contexte de chaque terme dans le texte
5. NE REFUSE JAMAIS de générer des mots-clés

RÈGLES STRICTES DE FORMATAGE :
1. Réponds UNIQUEMENT avec un JSON valide
2. PAS de virgules après le dernier élément
3. PAS de guillemets dans les définitions (sauf pour le JSON)
4. PAS de parenthèses ni de crochets dans les définitions
5. PAS de symboles markdown (#, *, _, etc.)

Format exact requis :
{
  "keywords": [
    {"term": "Terme du document", "definition": "Explication claire et simple du terme"},
    {"term": "Autre terme", "definition": "Explication claire et simple"}
  ]
}

Voici le contenu du document :

${textContent}`

            console.log("[v0] Calling AI Gateway for keywords with definitions")
            const { text: keywordsText } = await generateText({
              model: "google/gemini-2.0-flash", // Switched from OpenAI to Gemini 2.0 Flash
              prompt: keywordsPrompt,
              maxTokens: 1000,
              temperature: 0.3,
            })

            try {
              const jsonMatch = keywordsText.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const cleanedJson = jsonMatch[0]
                  .replace(/,(\s*[}\]])/g, "$1")
                  .replace(/\n/g, " ")
                  .trim()

                console.log("[v0] Attempting to parse keywords JSON")
                const parsed = JSON.parse(cleanedJson)

                if (parsed.keywords && Array.isArray(parsed.keywords)) {
                  results.keywords = parsed.keywords.map((kw: { term: string; definition: string }) => ({
                    term: kw.term.replace(/^["']|["']$/g, "").trim(),
                    definition: kw.definition
                      .replace(/^["']|["']$/g, "")
                      .replace(/$$[^)]*$$/g, "")
                      .replace(/\[[^\]]*\]/g, "")
                      .replace(/[#*_`]/g, "")
                      .replace(/["']/g, "")
                      .replace(/\s+/g, " ")
                      .trim(),
                  }))
                  console.log("[v0] Successfully generated keywords with definitions:", results.keywords.length)
                }
              }
            } catch (parseError) {
              console.error("[v0] Failed to parse keywords JSON:", parseError)
            }
          } catch (error) {
            console.error("[v0] Error generating keywords:", error)
          }
          completedTasks++
          await sendProgress("Mots-clés terminés", 15 + (completedTasks * 70) / totalTasks)
        }

        if (options?.generateFlashcards) {
          await sendProgress("Création des flashcards", 15 + (completedTasks * 70) / totalTasks)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          try {
            const timestamp = new Date().toISOString()
            const randomSeed = Math.floor(Math.random() * 10000)
            const flashcardPrompt = `Tu es un assistant spécialisé dans la création de flashcards pour la révision en ${options.subject}.

GÉNÉRATION #${randomSeed} - ${timestamp}

TU DOIS OBLIGATOIREMENT créer 6-10 flashcards de révision en français, MÊME SI le texte est court ou simple.

RÈGLES ABSOLUES DE VARIATION :
1. TU DOIS TOUJOURS générer des flashcards DIFFÉRENTES à chaque fois
2. VARIE les angles d'approche : définitions, applications, exemples, comparaisons, causes/conséquences
3. VARIE les niveaux de difficulté : questions simples, moyennes et complexes
4. VARIE les formulations : "Qu'est-ce que...", "Pourquoi...", "Comment...", "Quelle est la différence entre...", etc.
5. Si le texte est court, crée des questions sur CHAQUE élément d'information présent sous différents angles
6. Si c'est une introduction personnelle, crée des questions sur les détails mentionnés (nom, âge, lieux, sentiments, etc.)
7. Chaque flashcard doit tester la compréhension ou la mémorisation d'un élément du texte DE MANIÈRE UNIQUE
8. NE RÉPÈTE JAMAIS les mêmes questions ou formulations

Format des flashcards :
- Question : Claire et directe, qui teste un élément spécifique du texte SOUS UN ANGLE UNIQUE
- Réponse : Précise et basée sur le contenu du document

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "flashcards": [
    {"question": "Question 1?", "answer": "Réponse 1"},
    {"question": "Question 2?", "answer": "Réponse 2"}
  ]
}

Voici le contenu du document :

${textContent}`

            console.log("[v0] Calling AI Gateway for flashcards with variation seed:", randomSeed)
            const { text: flashcardText } = await generateText({
              model: "google/gemini-2.0-flash", // Switched from OpenAI to Gemini 2.0 Flash
              prompt: flashcardPrompt,
              maxTokens: 1500,
              temperature: 0.9,
            })

            try {
              const jsonMatch = flashcardText.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                results.flashcards = parsed.flashcards || []
                console.log("[v0] Successfully generated flashcards:", results.flashcards.length)
              }
            } catch (parseError) {
              console.error("[v0] Failed to parse flashcards JSON:", parseError)
            }
          } catch (error) {
            console.error("[v0] Error generating flashcards:", error)
            results.flashcards = []
          }
          completedTasks++
          await sendProgress("Flashcards terminées", 15 + (completedTasks * 70) / totalTasks)
        }

        if (options?.generateQCM) {
          await sendProgress("Génération du QCM", 15 + (completedTasks * 70) / totalTasks)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          try {
            console.log("[v0] ===== STARTING QCM GENERATION =====")
            const timestamp = new Date().toISOString()
            const randomSeed = Math.floor(Math.random() * 10000)
            const qcmPrompt = `Tu es un assistant spécialisé dans la création de QCM (Questions à Choix Multiples) pour la matière: ${options.subject}.

GÉNÉRATION #${randomSeed} - ${timestamp}

TU DOIS OBLIGATOIREMENT créer 5-8 questions à choix multiples en français, MÊME SI le texte est court ou simple.

RÈGLES ABSOLUES DE VARIATION :
1. TU DOIS TOUJOURS générer un QCM avec des questions DIFFÉRENTES à chaque fois
2. VARIE les types de questions : définitions, applications, analyses, comparaisons, causes/effets
3. VARIE les niveaux de difficulté : facile, moyen, difficile
4. VARIE les formulations : "Quel est...", "Pourquoi...", "Comment...", "Quelle différence...", "Quel exemple...", etc.
5. Si le texte est court, crée des questions sur CHAQUE information présente SOUS DIFFÉRENTS ANGLES
6. Si c'est une introduction personnelle, crée des questions sur les détails (nom, âge, sentiments, actions, etc.) avec des angles variés
7. Chaque question doit avoir 4 options plausibles et UNIQUES
8. NE RÉPÈTE JAMAIS les mêmes questions ou formulations
9. Explore TOUS les aspects du texte : détails, contexte, implications, exemples

Format des questions :
- Question claire qui teste un élément spécifique du texte SOUS UN ANGLE UNIQUE
- 4 options de réponse (dont 1 seule correcte)
- Index de la bonne réponse (0, 1, 2, ou 3)
- Explication courte

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "qcm": [
    {
      "question": "Question sur le texte?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "explanation": "Explication de la bonne réponse"
    }
  ]
}

IMPORTANT: correctAnswer doit être un nombre entre 0 et 3.

Voici le contenu du document :

${textContent}`

            console.log("[v0] Calling AI Gateway for QCM with variation seed:", randomSeed)
            const { text: qcmText } = await generateText({
              model: "google/gemini-2.0-flash", // Switched from OpenAI to Gemini 2.0 Flash
              prompt: qcmPrompt,
              maxTokens: 2000,
              temperature: 0.9,
            })

            try {
              const jsonMatch = qcmText.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const cleanedJson = jsonMatch[0]
                  .replace(/,(\s*[}\]])/g, "$1")
                  .replace(/\n/g, " ")
                  .trim()

                console.log("[v0] Attempting to parse QCM JSON")
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
                  console.log("[v0] ✅ Successfully generated QCM with", results.qcm.length, "valid questions")
                } else {
                  console.error("[v0] ❌ QCM array is empty or invalid")
                  results.qcm = []
                }
              } else {
                console.error("[v0] ❌ No JSON found in QCM response")
                results.qcm = []
              }
            } catch (parseError) {
              console.error("[v0] ❌ Failed to parse QCM JSON:", parseError)
              results.qcm = []
            }
          } catch (error) {
            console.error("[v0] ❌ Error generating QCM:", error)
            results.qcm = []
          }
          completedTasks++
          await sendProgress("QCM terminé", 15 + (completedTasks * 70) / totalTasks)
        }

        await sendProgress("Finalisation", 95)
        console.log("[v0] Summarization complete, returning results")

        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete", results })}\n\n`))
        await writer.close()
      } catch (error) {
        console.error("[v0] Error in processing:", error)
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: "Erreur lors de la génération", details: error instanceof Error ? error.message : "Unknown error" })}\n\n`,
          ),
        )
        await writer.close()
      }
    })()

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Error summarizing document:", error)

    if (error instanceof Error) {
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }

    return Response.json(
      {
        error: "Erreur lors de la génération du résumé",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
