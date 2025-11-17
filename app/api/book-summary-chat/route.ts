import { type NextRequest, NextResponse } from "next/server"

const PROMPT_PARTIEL_JSON = `Tu es un assistant littéraire **expert en analyse complète d'œuvres**. 
Ton objectif est de produire un **résumé détaillé et structuré** de la partie du livre fournie.

Analyse cette partie et retourne **uniquement un JSON valide** avec cette structure :
{
  "résumé": "Résumé détaillé incluant événements majeurs, personnages, évolution, relations, motivations, thèmes, symboles, citations clés avec contexte",
  "personnages": "Description des personnages présents dans cette partie",
  "thèmes": "Thèmes et motifs identifiés dans cette partie",
  "citations": ["citation 1", "citation 2"]
}

Si une information n'est pas présente dans cette partie : "Non précisé dans cette partie".
Sois extrêmement détaillé pour permettre une compréhension complète.`

const PROMPT_FUSION_JSON = `Tu es un assistant littéraire expert chargé de fusionner plusieurs analyses partielles d'un livre.

Fusionne ces analyses en un résumé cohérent et structuré.
Retourne **uniquement un JSON valide** avec cette structure :
{
  "résumé_final": "Résumé complet, chronologique et ultra détaillé de tout le livre",
  "personnages": "Description complète de tous les personnages, leur évolution, relations et motivations",
  "thèmes": "Tous les thèmes, motifs et symboles identifiés dans le livre",
  "citations": ["citation 1", "citation 2", "citation 3"]
}

Assure-toi que le résumé final soit cohérent, chronologique et suffisamment détaillé pour qu'un élève puisse répondre à toutes les questions d'examen.`

const PROMPT_ANALYSE_FINALE = `Tu es un assistant littéraire expert. À partir du résumé complet fourni, génère une analyse littéraire approfondie.

Retourne **uniquement un JSON valide** avec cette structure :
{
  "analyse_litteraire": "Analyse détaillée incluant : thèmes principaux et secondaires, style et techniques d'écriture, messages et morales, leçons, émotions dominantes, ton et technique narrative",
  "questions_examens": [
    {
      "question": "Question d'examen probable 1",
      "réponse": "Réponse complète et argumentée avec références au texte"
    },
    {
      "question": "Question d'examen probable 2",
      "réponse": "Réponse complète et argumentée avec références au texte"
    },
    {
      "question": "Question d'examen probable 3",
      "réponse": "Réponse complète et argumentée avec références au texte"
    },
    {
      "question": "Question d'examen probable 4",
      "réponse": "Réponse complète et argumentée avec références au texte"
    },
    {
      "question": "Question d'examen probable 5",
      "réponse": "Réponse complète et argumentée avec références au texte"
    },
    {
      "question": "Question d'examen probable 6",
      "réponse": "Réponse complète et argumentée avec références au texte"
    }
  ]
}

Les questions doivent couvrir : compréhension globale, analyse des personnages, thèmes, style, contexte historique/social, et interprétation personnelle.`

function cleanText(text: string): string {
  if (!text) return ""

  let cleaned = text
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/!\[.*?\]$$.*?$$/g, " ") // Remove markdown images
    .replace(/\n+/g, " ") // Replace multiple newlines with space
    .replace(/\r\n/g, "\n") // Normalize line breaks
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
    .replace(/[ \t]{2,}/g, " ") // Replace multiple spaces/tabs with single space
    .replace(/^\s+|\s+$/gm, "") // Trim each line

  // Remove common PDF artifacts
  cleaned = cleaned
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .replace(/\uFFFD/g, "") // Remove replacement characters

  return cleaned.trim()
}

function splitTextIntoChunks(text: string, maxChars = 3500): string[] {
  const chunks: string[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxChars

    // Try to find a good breaking point (paragraph or sentence)
    if (endIndex < text.length) {
      const nextParagraph = text.indexOf("\n\n", endIndex - 200)
      const nextSentence = text.lastIndexOf(". ", endIndex)

      if (nextParagraph > currentIndex && nextParagraph < endIndex + 200) {
        endIndex = nextParagraph + 2
      } else if (nextSentence > currentIndex) {
        endIndex = nextSentence + 2
      }
    }

    const chunk = text.slice(currentIndex, endIndex).trim()
    if (chunk.length > 100) {
      chunks.push(chunk)
    }
    currentIndex = endIndex
  }

  return chunks
}

async function callGroqAPI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  try {
    console.log("[v0] Calling Groq API with prompt length:", userPrompt.length)

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    console.log("[v0] Groq API response status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error("[v0] Groq API error - Status:", response.status)
      console.error("[v0] Groq API error - Response:", text)
      return ""
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || ""

    if (!content || content.trim().length === 0) {
      console.error("[v0] Groq API returned empty content")
    }

    console.log("[v0] Response received, length:", content.length)
    return content
  } catch (e) {
    console.error("[v0] Groq API call failed with exception:", e)
    return ""
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookTitle, author, bookContent, includeQA } = body

    console.log("[v0] ========== NEW LITERARY ANALYSIS REQUEST ==========")
    console.log("[v0] Book:", bookTitle, "by", author)
    console.log("[v0] bookContent length (raw):", bookContent?.length || 0, "characters")
    console.log("[v0] Include Q&A:", includeQA)

    if (!bookContent) {
      console.error("[v0] No bookContent received")
      return NextResponse.json({ error: "Aucun contenu de livre reçu" }, { status: 400 })
    }

    if (!bookTitle || !author) {
      return NextResponse.json({ error: "bookTitle et author requis" }, { status: 400 })
    }

    const cleanedContent = cleanText(bookContent)
    console.log("[v0] bookContent length (after cleaning):", cleanedContent.length, "characters")

    if (!cleanedContent || cleanedContent.trim().length === 0) {
      console.error("[v0] CRITICAL: bookContent is empty after cleaning")
      return NextResponse.json(
        { error: "Aucun texte détecté dans ce fichier. Essayez un PDF contenant du texte." },
        { status: 400 },
      )
    }

    if (cleanedContent.length < 100) {
      console.error("[v0] CRITICAL: bookContent too short (less than 100 characters)")
      return NextResponse.json(
        { error: "Aucun texte détecté dans ce fichier. Essayez un PDF contenant du texte." },
        { status: 400 },
      )
    }

    const apiKey =
      process.env.GROQ_API_KEY || // Standard Groq integration variable
      process.env.API_KEY_GROQ_API_KEY || // Custom variable with underscore
      process.env["API-KEY_GROQ_API_KEY"] // Custom variable with hyphen

    console.log("[v0] Checking API key...")
    console.log("[v0] GROQ_API_KEY present:", !!process.env.GROQ_API_KEY)
    console.log("[v0] API_KEY_GROQ_API_KEY present:", !!process.env.API_KEY_GROQ_API_KEY)
    console.log("[v0] API-KEY_GROQ_API_KEY present:", !!process.env["API-KEY_GROQ_API_KEY"])
    console.log("[v0] Using API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NONE")

    if (!apiKey) {
      console.error("[v0] CRITICAL: No API key found!")
      console.error(
        "[v0] Available env vars:",
        Object.keys(process.env).filter((k) => k.includes("GROQ")),
      )
      return NextResponse.json(
        {
          error: "Clé API Groq manquante. Veuillez ajouter GROQ_API_KEY dans la section Vars de la barre latérale.",
        },
        { status: 500 },
      )
    }

    const chunks = splitTextIntoChunks(cleanedContent, 3500)
    console.log("[v0] Number of chunks:", chunks.length)
    console.log("[v0] First chunk preview (first 200 chars):", chunks[0]?.substring(0, 200))

    if (chunks.length === 0) {
      console.error("[v0] CRITICAL: No valid chunks after splitting")
      return NextResponse.json(
        { error: "Aucun texte détecté dans ce fichier. Essayez un PDF contenant du texte." },
        { status: 400 },
      )
    }

    const partialAnalyses: string[] = []
    const failedChunks: number[] = []

    for (let i = 0; i < chunks.length; i++) {
      console.log(`[v0] ========== Processing chunk ${i + 1}/${chunks.length} ==========`)
      console.log(`[v0] Chunk length: ${chunks[i].length} characters`)

      const prompt = `Titre : ${bookTitle}
Auteur : ${author}

Partie ${i + 1}/${chunks.length} du livre :

${chunks[i]}`

      try {
        const analysis = await callGroqAPI(PROMPT_PARTIEL_JSON, prompt, apiKey)

        if (analysis && analysis.trim().length > 0) {
          console.log(`[v0] Partial analysis received for chunk ${i + 1}, length: ${analysis.length}`)
          console.log(`[v0] Analysis preview:`, analysis.substring(0, 200))
          partialAnalyses.push(analysis)
        } else {
          console.error(`[v0] Chunk ${i + 1} failed: empty response`)
          failedChunks.push(i + 1)
        }
      } catch (error) {
        console.error(`[v0] Chunk ${i + 1} failed with exception:`, error)
        failedChunks.push(i + 1)
      }
    }

    const validAnalyses = partialAnalyses.filter((s) => s.trim() !== "")

    if (validAnalyses.length === 0) {
      console.error("[v0] CRITICAL: All chunks failed")
      console.error("[v0] Failed chunks:", failedChunks)
      console.error("[v0] Total chunks:", chunks.length)
      return NextResponse.json(
        {
          error:
            "Tous les chunks ont échoué. Vérifiez que votre clé API Groq est valide et que vous n'avez pas atteint la limite de requêtes.",
          chunks_echoues: failedChunks,
          total_chunks: chunks.length,
        },
        { status: 500 },
      )
    }

    console.log(`[v0] Valid analyses: ${validAnalyses.length}/${chunks.length}`)

    console.log("[v0] ========== FUSING PARTIAL ANALYSES ==========")
    const fusionPrompt = `Titre : ${bookTitle}
Auteur : ${author}

Analyses partielles à fusionner :

${validAnalyses.join("\n\n---\n\n")}`

    const fusedAnalysis = await callGroqAPI(PROMPT_FUSION_JSON, fusionPrompt, apiKey)
    console.log("[v0] Fused analysis length:", fusedAnalysis.length)

    let finalSummary = fusedAnalysis

    if (includeQA) {
      console.log("[v0] ========== GENERATING LITERARY ANALYSIS & EXAM QUESTIONS ==========")
      const analysisPrompt = `Titre : ${bookTitle}
Auteur : ${author}

Résumé complet du livre :

${fusedAnalysis}`

      const literaryAnalysis = await callGroqAPI(PROMPT_ANALYSE_FINALE, analysisPrompt, apiKey)
      console.log("[v0] Literary analysis length:", literaryAnalysis.length)

      // Combine fused analysis with literary analysis
      finalSummary = `${fusedAnalysis}\n\n---\n\n${literaryAnalysis}`
    }

    console.log("[v0] Final summary length:", finalSummary.length, "characters")

    return NextResponse.json({
      summary: finalSummary,
      chunksProcessed: validAnalyses.length,
      totalChunks: chunks.length,
      failedChunks: failedChunks.length > 0 ? failedChunks : undefined,
    })
  } catch (e) {
    console.error("[v0] API book-summary-chat error:", e)
    return NextResponse.json({ error: "Erreur serveur lors de la génération du résumé" }, { status: 500 })
  }
}
