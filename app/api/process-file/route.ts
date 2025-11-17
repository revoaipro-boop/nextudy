import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const subject = formData.get("subject") as string
    const grade = formData.get("grade") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file content
    const text = await file.text()

    // Get subject-specific structuring prompt
    const structuringPrompt = getStructuringPrompt(subject)

    // Call Groq API to structure the content
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Tu es Nextudy, un assistant pédagogique expert. L'élève est en ${grade}.

${structuringPrompt}

Analyse le texte fourni et transforme-le en fiche de structuration complète selon les règles ci-dessus.`,
          },
          {
            role: "user",
            content: `Voici le contenu à structurer :\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to process file with Groq")
    }

    const data = await response.json()
    const structuredContent = data.choices[0]?.message?.content || ""

    return NextResponse.json({ content: structuredContent })
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}

function getStructuringPrompt(subject: string): string {
  const prompts: Record<string, string> = {
    Mathématiques: `📘 Structure pour Mathématiques :

Rôle : Structure le contenu mathématique en étapes de raisonnement et en hiérarchies logiques.

Structure à suivre :
1. Titre du chapitre / notion principale
2. Définitions fondamentales (avec formulation claire)
3. Propriétés et théorèmes essentiels (avec conditions d'application)
4. Démonstrations simplifiées (étape par étape, avec logique visible)
5. Méthodes à retenir (formules, astuces, erreurs à éviter)
6. Exemples types (avec résolution expliquée)
7. Résumé final (rappel rapide de la logique du chapitre)`,

    Physique: `📗 Structure pour Physique-Chimie :

Rôle : Organise le cours de façon à relier les formules, les lois et les phénomènes concrets.

Structure à suivre :
1. Phénomène ou thème étudié
2. Concepts et grandeurs physiques (définition + unité)
3. Lois fondamentales (avec explication intuitive et mathématique)
4. Applications expérimentales ou exemples concrets
5. Méthodes de résolution d'exercices
6. Schémas mentaux à retenir (chaîne cause → effet → formule)
7. Synthèse courte`,

    Chimie: `📗 Structure pour Physique-Chimie :

Rôle : Organise le cours de façon à relier les formules, les lois et les phénomènes concrets.

Structure à suivre :
1. Phénomène ou thème étudié
2. Concepts et grandeurs physiques (définition + unité)
3. Lois fondamentales (avec explication intuitive et mathématique)
4. Applications expérimentales ou exemples concrets
5. Méthodes de résolution d'exercices
6. Schémas mentaux à retenir (chaîne cause → effet → formule)
7. Synthèse courte`,

    Histoire: `📙 Structure pour Histoire-Géographie :

Rôle : Transformer le texte en fiche chronologique et thématique, pour faciliter la compréhension des causes et conséquences.

Structure à suivre :
1. Thème / période / problématique
2. Contexte historique (économique, social, politique)
3. Événements majeurs (date + cause + conséquence)
4. Acteurs clés (rôle et impact)
5. Notions à retenir (concepts de cours, définitions claires)
6. Synthèse logique : comment tout s'articule
7. Ouverture (liens avec d'autres chapitres ou enjeux actuels)`,

    Géographie: `📙 Structure pour Histoire-Géographie :

Rôle : Transformer le texte en fiche chronologique et thématique, pour faciliter la compréhension des causes et conséquences.

Structure à suivre :
1. Thème / période / problématique
2. Contexte historique (économique, social, politique)
3. Événements majeurs (date + cause + conséquence)
4. Acteurs clés (rôle et impact)
5. Notions à retenir (concepts de cours, définitions claires)
6. Synthèse logique : comment tout s'articule
7. Ouverture (liens avec d'autres chapitres ou enjeux actuels)`,

    Français: `📒 Structure pour Français / Philosophie :

Rôle : Structurer le texte pour comprendre idées, argumentation et sens global.

Structure à suivre :
1. Thème / œuvre / auteur / contexte
2. Idée centrale du texte
3. Arguments principaux et secondaires
4. Exemples ou références culturelles
5. Procédés de style / figures de pensée (si littérature)
6. Interprétation / portée du texte
7. Synthèse en une phrase forte`,

    Philosophie: `📒 Structure pour Français / Philosophie :

Rôle : Structurer le texte pour comprendre idées, argumentation et sens global.

Structure à suivre :
1. Thème / œuvre / auteur / contexte
2. Idée centrale du texte
3. Arguments principaux et secondaires
4. Exemples ou références culturelles
5. Procédés de style / figures de pensée (si littérature)
6. Interprétation / portée du texte
7. Synthèse en une phrase forte`,

    SVT: `📕 Structure pour SVT :

Rôle : Clarifier les mécanismes biologiques et géologiques en séquences logiques et visuelles.

Structure à suivre :
1. Phénomène biologique ou géologique étudié
2. Problématique scientifique
3. Étapes du mécanisme (cause → processus → résultat)
4. Schéma mental à retenir
5. Notions-clés / vocabulaire précis
6. Expériences de référence
7. Résumé fonctionnel : ce qu'il faut retenir pour comprendre et restituer`,

    Anglais: `📓 Structure pour Langues étrangères :

Rôle : Structurer les règles, le vocabulaire et les usages dans une logique d'entraînement rapide.

Structure à suivre :
1. Thème grammatical ou lexical
2. Règle principale expliquée simplement
3. Exemples corrects / incorrects
4. Cas particuliers ou exceptions
5. Expressions à mémoriser
6. Mini quiz ou exercice-type
7. Résumé express`,

    Espagnol: `📓 Structure pour Langues étrangères :

Rôle : Structurer les règles, le vocabulaire et les usages dans une logique d'entraînement rapide.

Structure à suivre :
1. Thème grammatical ou lexical
2. Règle principale expliquée simplement
3. Exemples corrects / incorrects
4. Cas particuliers ou exceptions
5. Expressions à mémoriser
6. Mini quiz ou exercice-type
7. Résumé express`,

    Informatique: `📓 Structure pour Langues étrangères :

Rôle : Structurer les règles, le vocabulaire et les usages dans une logique d'entraînement rapide.

Structure à suivre :
1. Thème grammatical ou lexical
2. Règle principale expliquée simplement
3. Exemples corrects / incorrects
4. Cas particuliers ou exceptions
5. Expressions à mémoriser
6. Mini quiz ou exercice-type
7. Résumé express`,
  }

  return (
    prompts[subject] ||
    `Instruction globale :
Analyse le texte fourni (issu d'un PDF ou d'une transcription audio). Ne fais pas un simple résumé. Transforme-le en fiche de structuration complète.

But : maximiser la compréhension, la mémorisation et la capacité de restitution à l'examen.

Règles générales :
- Sépare toujours les idées principales, secondaires et les exemples
- Supprime les phrases inutiles ou vagues
- Réécris les notions avec un langage clair et précis, adapté à un élève de lycée
- Ajoute une progression logique : du plus général au plus précis
- Mets en évidence : Définitions essentielles, Concepts-clés, Dates importantes, Mécanismes ou raisonnements logiques
- Termine par une synthèse ultra-courte : 3 phrases qui résument tout le chapitre

Le but n'est pas de condenser, mais de structurer pour apprendre efficacement.`
  )
}
