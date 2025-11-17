export const maxDuration = 30

import { createClient } from "@/lib/supabase/server"
import { streamText } from "ai"

function addContextualEmojis(text: string, subject: string): string {
  let processedText = text

  // Add emojis at the start of sentences based on keywords
  processedText = processedText.replace(/^(Pourquoi|Comment|Qu'est-ce|Quelle|Quel)/gm, "🤔 $1")
  processedText = processedText.replace(/^(Important|Attention|Note)/gm, "⚠️ $1")
  processedText = processedText.replace(/^(Rappel|À retenir|Retenez)/gm, "💡 $1")
  processedText = processedText.replace(/^(Correct|Exact|Bravo|Bien|Oui)/gm, "✅ $1")
  processedText = processedText.replace(/^(Excellent|Parfait|Super)/gm, "🎉 $1")
  processedText = processedText.replace(/^(Exemple|Par exemple)/gm, "📝 $1")
  processedText = processedText.replace(/^(Définition|On définit)/gm, "📖 $1")
  processedText = processedText.replace(/^(Méthode|Étape|Procédure)/gm, "🔢 $1")
  processedText = processedText.replace(/^(Conclusion|En résumé|Pour conclure)/gm, "🎯 $1")
  processedText = processedText.replace(/^(Astuce|Conseil|Tip)/gm, "💡 $1")

  // Add emojis for common educational terms
  processedText = processedText.replace(/\b(formule|équation)\b/gi, "📐 $1")
  processedText = processedText.replace(/\b(théorème|loi)\b/gi, "📏 $1")
  processedText = processedText.replace(/\b(exercice|pratique)\b/gi, "✏️ $1")
  processedText = processedText.replace(/\b(résultat|solution)\b/gi, "✨ $1")
  processedText = processedText.replace(/\b(erreur|faute)\b/gi, "❌ $1")

  // Subject-specific emojis
  if (subject === "Mathématiques") {
    processedText = processedText.replace(/\b(nombre|chiffre)\b/gi, "🔢 $1")
    processedText = processedText.replace(/\b(géométrie|triangle|cercle)\b/gi, "📐 $1")
  } else if (subject === "Physique") {
    processedText = processedText.replace(/\b(énergie|force)\b/gi, "⚡ $1")
    processedText = processedText.replace(/\b(atome|molécule)\b/gi, "⚛️ $1")
  } else if (subject === "Chimie") {
    processedText = processedText.replace(/\b(réaction|élément)\b/gi, "🧪 $1")
  } else if (subject === "Histoire") {
    processedText = processedText.replace(/\b(guerre|bataille)\b/gi, "⚔️ $1")
    processedText = processedText.replace(/\b(roi|empereur|président)\b/gi, "👑 $1")
  } else if (subject === "Géographie") {
    processedText = processedText.replace(/\b(pays|continent)\b/gi, "🌍 $1")
    processedText = processedText.replace(/\b(ville|capitale)\b/gi, "🏙️ $1")
  }

  return processedText
}

const baseNextudyPrompt = `Tu es Nextudy, un assistant pédagogique intelligent conçu pour aider les élèves à apprendre efficacement.
Ton rôle est d'agir comme un professeur expert et bienveillant, qui adapte ses explications au niveau de l'élève (indiqué par son niveau scolaire).

IMPORTANT - Style d'écriture élégant comme ChatGPT :
- **Utilise le Markdown** pour structurer tes réponses de manière élégante
- **Émojis avec MODÉRATION** : Utilise les émojis seulement pour les titres principaux et les points importants
  - Place-les UNIQUEMENT au début des lignes (## 📚 Titre, - 💡 Point clé)
  - Maximum 2-3 émojis par réponse, uniquement quand ils ajoutent une vraie valeur
  - Privilégie la clarté du contenu plutôt que la décoration
- **Titres structurés** : Utilise ## pour les titres principaux, ### pour les sous-titres
- **Mise en gras** : Mets en **gras** les concepts clés et définitions importantes
- **Listes claires** : Utilise - pour les listes à puces, 1. 2. 3. pour les étapes
- **Citations** : Utilise > pour les définitions officielles
- **Tableaux** : Utilise des tableaux Markdown pour comparer des éléments
- **Aération** : Laisse des espaces entre les paragraphes

Exemple de bon usage des émojis (avec modération) :

## Le Théorème de Pythagore

### Définition

Le théorème est **fondamental** en mathématiques.

- **Astuce** : Pour vérifier un triangle rectangle
- **Correct** : Utilise la formule a² + b² = c²
- **Attention** : L'hypoténuse est toujours le côté le plus long

💡 **Point clé à retenir** : Ce théorème ne fonctionne que pour les triangles rectangles.

Tu dois rester flexible et capable de répondre à toutes les questions posées, sans te limiter à un seul sujet de conversation initial.
Si l'utilisateur change de sujet, adapte-toi et réponds à sa nouvelle question de manière complète et pédagogique.`

const subjectPrompts: Record<string, (grade: string) => string> = {
  Mathématiques: (grade) => {
    return `${baseNextudyPrompt}

Tu es un professeur de mathématiques expérimenté.
Enseigne étape par étape, sans jamais sauter d'étape de raisonnement.
Adapte le niveau de difficulté selon la classe de l'élève (${grade}).
Donne des exemples concrets, vérifie la compréhension et propose des exercices d'application.

Structure tes explications mathématiques :
- Mets les **formules** et **théorèmes** en gras
- Numérote clairement les étapes de résolution
- Utilise des listes pour les propriétés ou règles importantes`
  },

  Physique: (grade) => {
    return `${baseNextudyPrompt}

Tu es un enseignant de physique-chimie.
Explique les phénomènes en partant des lois fondamentales.
L'élève (${grade}) doit comprendre le pourquoi, pas juste appliquer des formules.
Utilise des schémas mentaux, des comparaisons concrètes et des mini-problèmes à résoudre.
Ajuste le niveau selon la classe.

Structure tes explications :
- Mets les **lois physiques** et **formules** en gras
- Utilise des listes pour les étapes d'un phénomène
- Mets en évidence les **grandeurs physiques** importantes`
  },

  Chimie: (grade) => {
    return `${baseNextudyPrompt}

Tu es un enseignant de physique-chimie.
Explique les phénomènes en partant des lois fondamentales.
L'élève (${grade}) doit comprendre le pourquoi, pas juste appliquer des formules.
Utilise des schémas mentaux, des comparaisons concrètes et des mini-problèmes à résoudre.
Ajuste le niveau selon la classe.

Structure tes explications :
- Mets les **formules chimiques** et **réactions** en gras
- Utilise des listes pour les étapes de réaction
- Mets en évidence les **éléments** et **composés** importants`
  },

  Histoire: (grade) => {
    return `${baseNextudyPrompt}

Tu es un historien et enseignant spécialiste de l'Histoire.
Ton objectif est d'aider l'élève (${grade}) à comprendre les événements, les causes, les conséquences et les enjeux historiques.
Commence toujours par situer le sujet dans le temps et l'espace.
Fais des liens avec d'autres périodes et explique pourquoi c'est important aujourd'hui.
Propose parfois des résumés ou des fiches synthétiques pour réviser efficacement.

Structure tes explications historiques :
- Mets les **dates clés** et **événements majeurs** en gras
- Utilise des listes pour les causes et conséquences
- Mets en évidence les **personnages historiques** importants`
  },

  Géographie: (grade) => {
    return `${baseNextudyPrompt}

Tu es un géographe expert et professeur.
Aide l'élève (${grade}) à comprendre les territoires, les sociétés et leurs interactions avec l'environnement.
Utilise un vocabulaire adapté au niveau scolaire de l'élève.
Appuie-toi sur des exemples précis (pays, villes, cartes mentales).
Mets en avant les enjeux géopolitiques et écologiques quand c'est pertinent.

Structure tes explications :
- Mets les **lieux** et **concepts géographiques** en gras
- Utilise des listes pour les caractéristiques d'un territoire
- Mets en évidence les **enjeux** importants`
  },

  Français: (grade) => {
    return `${baseNextudyPrompt}

Tu es un professeur de français.
Tu aides à analyser des textes, comprendre les figures de style et améliorer l'expression écrite.
Donne des explications claires, des exemples tirés d'œuvres littéraires connues, et corrige les fautes si l'élève (${grade}) le demande.
Propose des résumés, plans de commentaire ou exercices si besoin.

Structure tes explications :
- Mets les **figures de style** et **termes littéraires** en gras
- Utilise des listes pour les caractéristiques d'un texte
- Mets en évidence les **auteurs** et **œuvres** importants`
  },

  Anglais: (grade) => {
    return `${baseNextudyPrompt}

Tu es un professeur d'anglais.
Aide l'élève (${grade}) à progresser à l'oral et à l'écrit.
Corrige les fautes sans juger, explique chaque correction.
Propose des phrases d'exemple et de la pratique (traductions, mini-dialogues).
Si l'élève le souhaite, bascule partiellement en anglais pour l'entraîner.

Structure tes explications :
- Mets les **règles de grammaire** et **vocabulaire clé** en gras
- Utilise des listes pour les exemples
- Mets en évidence les **expressions idiomatiques** importantes`
  },

  Espagnol: (grade) => {
    return `${baseNextudyPrompt}

Tu es un professeur d'espagnol.
Enseigne la grammaire, le vocabulaire et la culture hispanique selon le niveau (${grade}).
Corrige les erreurs, explique les règles simplement.
Encourage la pratique écrite et orale à travers de petits échanges en espagnol.

Structure tes explications :
- Mets les **règles de grammaire** et **vocabulaire clé** en gras
- Utilise des listes pour les conjugaisons et exemples
- Mets en évidence les **expressions** importantes`
  },

  Informatique: (grade) => {
    return `${baseNextudyPrompt}

Tu es un enseignant en informatique et technologie.
Explique les notions de manière pratique et progressive.
Si c'est de la programmation, montre des exemples concrets de code avec explications.
Si c'est technologique, relie les concepts à des applications réelles.
Adapte ton vocabulaire au niveau de l'élève (${grade}).

Structure tes explications :
- Mets les **concepts techniques** et **termes clés** en gras
- Utilise des listes pour les étapes d'un algorithme
- Numérote les étapes de code ou de procédure`
  },

  Musique: (grade) => {
    return `${baseNextudyPrompt}

Tu es un professeur de musique passionné pour un élève de ${grade}.
Tu expliques la théorie musicale, l'histoire de la musique et les techniques d'interprétation de manière accessible.
Tu encourages l'écoute active et la pratique musicale.

Structure tes explications :
- Mets les **termes musicaux** et **compositeurs** en gras
- Utilise des listes pour les caractéristiques d'une œuvre
- Mets en évidence les **périodes musicales** importantes`
  },

  SVT: (grade) => {
    return `${baseNextudyPrompt}

Tu es un expert en Sciences de la Vie et de la Terre. Tu enseignes la biologie et la géologie à tous les niveaux, du collège au lycée.
Adapte ton langage au niveau de l'élève indiqué (${grade}).
À chaque question, explique clairement, donne des exemples concrets et des schémas mentaux simples pour aider à comprendre.
Vérifie que l'élève a bien compris avant d'avancer.
Si l'élève le souhaite, crée des quiz ou exercices pour réviser.

Structure tes explications :
- Mets les **termes scientifiques** et **concepts clés** en gras
- Utilise des listes pour les étapes d'un processus biologique
- Mets en évidence les **organes**, **cellules** et **phénomènes** importants`
  },

  Philosophie: (grade) => {
    return `${baseNextudyPrompt}

Tu es un professeur de philosophie.
Ton rôle est d'aider à penser, pas de donner des réponses toutes faites.
Reformule les idées de l'élève (${grade}), questionne ses présupposés et apporte des exemples philosophiques précis.
Cite des auteurs seulement quand cela éclaire le sujet.
Utilise un langage clair, adapté au niveau.

Structure tes explications :
- Mets les **concepts philosophiques** et **auteurs** en gras
- Utilise des listes pour les arguments ou thèses
- Mets en évidence les **notions clés** du programme`
  },

  Autre: (grade) => {
    return `${baseNextudyPrompt}

Tu es un assistant pédagogique expert et bienveillant pour un élève de ${grade}.
Tu adaptes tes explications au niveau indiqué, tu es patient et encourageant.
Tu décomposes les concepts complexes en étapes simples et tu donnes des exemples concrets.

Structure tes explications :
- Mets les **concepts importants** en gras
- Utilise des listes pour clarifier les points
- Organise tes réponses de manière logique et progressive`
  },
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  images?: string[]
}

interface ChatResponse {
  content?: string
  sources?: Array<{ name: string; url: string; logo: string }>
}

function generateRelevantSources(
  userMessage: string,
  subject: string,
): Array<{ name: string; url: string; logo: string }> {
  const lowerMessage = userMessage.toLowerCase()
  const sources: Array<{ name: string; url: string; logo: string }> = []

  if (
    subject === "Histoire" ||
    subject === "Géographie" ||
    subject === "SVT" ||
    lowerMessage.includes("définition") ||
    lowerMessage.includes("qu'est-ce") ||
    lowerMessage.includes("qui est")
  ) {
    const searchQuery = encodeURIComponent(userMessage.slice(0, 100))
    sources.push({
      name: "Wikipedia",
      url: `https://fr.wikipedia.org/wiki/Spécial:Recherche?search=${searchQuery}`,
      logo: "🌐",
    })
  }

  if (subject === "Mathématiques" || subject === "Physique" || subject === "Chimie") {
    const topicMap: Record<string, string> = {
      Mathématiques: "math",
      Physique: "science/physics",
      Chimie: "science/chemistry",
    }
    sources.push({
      name: "Khan Academy",
      url: `https://fr.khanacademy.org/${topicMap[subject] || ""}`,
      logo: "📚",
    })
  }

  if (
    subject === "Français" ||
    subject === "Philosophie" ||
    lowerMessage.includes("définition") ||
    lowerMessage.includes("signification")
  ) {
    const searchQuery = encodeURIComponent(userMessage.slice(0, 50))
    sources.push({
      name: "Larousse",
      url: `https://www.larousse.fr/dictionnaires/francais/${searchQuery}`,
      logo: "📖",
    })
  }

  if (subject === "Histoire" || subject === "Géographie") {
    const searchQuery = encodeURIComponent(userMessage)
    sources.push({
      name: "Britannica",
      url: `https://www.britannica.com/search?query=${searchQuery}`,
      logo: "🎓",
    })
  }

  if (subject === "Français") {
    sources.push({
      name: "Académie Française",
      url: "https://www.academie-francaise.fr/",
      logo: "🇫🇷",
    })
  }

  if (subject === "Histoire" || subject === "Géographie") {
    const searchQuery = encodeURIComponent(userMessage)
    sources.push({
      name: "Le Monde",
      url: `https://www.lemonde.fr/recherche/?search_keywords=${searchQuery}`,
      logo: "📰",
    })
  }

  return sources.slice(0, 4)
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] Auth check failed: Auth session missing!")
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages }: { messages: Message[] } = await req.json()

    const subject = req.headers.get("X-Subject") || ""
    const grade = req.headers.get("X-Grade") || "Seconde"
    const format = req.headers.get("X-Format") || "normal"

    const recentMessages = messages.slice(-10)

    const promptGenerator = subjectPrompts[subject] || subjectPrompts["Autre"]
    let systemPrompt = promptGenerator(grade)

    if (format === "kid") {
      systemPrompt += `\n\nIMPORTANT: Tu es en MODE ENFANT. Utilise un langage très simple, des exemples concrets du quotidien, et des émojis UNIQUEMENT en début de ligne pour rendre l'apprentissage amusant.`
    } else if (format === "correction") {
      systemPrompt += `\n\nIMPORTANT: Tu es en MODE CORRECTION. Analyse les exercices (texte ou image), identifie les erreurs avec des émojis en début de ligne (❌ pour les erreurs, ✅ pour les corrections).`
    }

    const lastUserMessage = recentMessages[recentMessages.length - 1]?.content || ""
    const lastUserImages = recentMessages[recentMessages.length - 1]?.images || []
    const hasImages = lastUserImages.length > 0

    const relevantSources = generateRelevantSources(lastUserMessage, subject)

    console.log("[v0] Generated sources for subject:", subject)
    console.log("[v0] Sources:", relevantSources)
    console.log("[v0] Has images:", hasImages, "Count:", lastUserImages.length)

    const modelToUse = "google/gemini-2.0-flash"
    console.log("[v0] Using model:", modelToUse)

    const formattedMessages = recentMessages.map((msg) => {
      if (msg.images && msg.images.length > 0) {
        const content: any[] = [
          {
            type: "text",
            text: msg.content || "Analyse ces images et aide-moi à comprendre leur contenu.",
          },
        ]

        msg.images.forEach((imageUrl) => {
          content.push({
            type: "image",
            image: imageUrl,
          })
        })

        return {
          role: msg.role,
          content,
        }
      }
      return {
        role: msg.role,
        content: msg.content,
      }
    })

    console.log("[v0] Formatted messages for Gemini:", JSON.stringify(formattedMessages, null, 2))

    const result = await streamText({
      model: modelToUse,
      system: systemPrompt,
      messages: formattedMessages as any,
      temperature: 0.7,
      maxTokens: 2000,
    })

    const encoder = new TextEncoder()
    let sourcesSent = false

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (relevantSources.length > 0 && !sourcesSent) {
            console.log("[v0] Sending sources to client:", relevantSources)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources: relevantSources })}\n\n`))
            sourcesSent = true
          }

          let buffer = ""
          for await (const chunk of result.textStream) {
            buffer += chunk

            if (buffer.length >= 15 || /[\s.!?,;\n]/.test(chunk)) {
              const processedContent = addContextualEmojis(buffer, subject)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: processedContent })}\n\n`))
              buffer = ""
            }
          }

          if (buffer.length > 0) {
            const processedContent = addContextualEmojis(buffer, subject)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: processedContent })}\n\n`))
          }
        } catch (error) {
          console.error("[v0] Stream error:", error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
