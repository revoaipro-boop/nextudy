import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

const SEARCH_AND_SUMMARIZE_PROMPT = `Tu es un assistant littéraire expert. À partir du titre et de l'auteur fournis, génère un résumé complet du livre avec des sources réelles et vérifiables.

IMPORTANT: Tu DOIS citer des sources réelles et spécifiques pour chaque information. Utilise des URLs réelles vers:
- Wikipedia (articles spécifiques sur le livre)
- SparkNotes ou CliffsNotes (analyses littéraires)
- Sites académiques (.edu)
- Bibliothèques numériques
- Sites littéraires reconnus

Format de réponse (Markdown):

## Fiche Technique
- **Titre**: [titre]
- **Auteur**: [auteur]
- **Année de publication**: [année]
- **Genre**: [genre]

## Résumé Complet
[Résumé détaillé du livre avec événements principaux, personnages, intrigue]

**Sources:**
- [Titre de la source 1](URL réelle)
- [Titre de la source 2](URL réelle)

## Personnages Principaux
[Description des personnages avec leurs rôles et évolutions]

**Sources:**
- [Titre de la source](URL réelle)

## Thèmes et Symboles
[Analyse des thèmes principaux et symboles]

**Sources:**
- [Titre de la source](URL réelle)

## Citations Clés
> "Citation 1" - Contexte

**Source:** [Titre de la source](URL réelle)

## Analyse Littéraire
[Style, techniques narratives, messages]

**Sources:**
- [Titre de la source](URL réelle)

## Questions d'Examen Probables

### Question 1: [Question]
**Réponse:** [Réponse détaillée]
**Sources:** [Titre](URL)

[Répéter pour 5-6 questions]

RÈGLES STRICTES:
1. Chaque section DOIT avoir des sources avec des URLs réelles
2. Les URLs doivent pointer vers des pages spécifiques, pas juste des domaines
3. Privilégie Wikipedia, SparkNotes, sites académiques
4. Si tu n'es pas sûr d'une source, utilise une recherche Wikipedia générique mais spécifie le titre du livre dans l'URL`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookTitle, author } = body

    console.log("[v0] Generating summary for:", bookTitle, "by", author)

    if (!bookTitle || !author) {
      return NextResponse.json({ error: "Titre et auteur requis" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY || process.env["API-KEY_GROQ_API_KEY"]

    if (!apiKey) {
      console.error("[v0] No Groq API key found")
      return NextResponse.json({ error: "Clé API manquante" }, { status: 500 })
    }

    const prompt = `Génère un résumé complet avec sources pour:
Titre: ${bookTitle}
Auteur: ${author}

N'oublie pas: CHAQUE section doit avoir des sources réelles avec des URLs spécifiques.`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: SEARCH_AND_SUMMARIZE_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Groq API error:", errorText)
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 })
    }

    const data = await response.json()
    const summary = data?.choices?.[0]?.message?.content || ""

    if (!summary) {
      return NextResponse.json({ error: "Aucun résumé généré" }, { status: 500 })
    }

    console.log("[v0] Summary generated, length:", summary.length)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("[v0] Error in book-summary-from-title:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
