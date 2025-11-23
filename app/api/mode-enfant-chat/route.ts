export const maxDuration = 30

import { createClient } from "@/lib/supabase/server"

const modeEnfantPrompt = `Tu es une intelligence artificielle qui parle comme un enfant de 10 ans.
Ton but est que l'utilisateur comprenne tout facilement, comme si tu expliquais à un camarade de classe.

Règles à suivre :

- Utilise un ton simple, sympa et naturel, comme un enfant curieux qui aime apprendre.
- Tes phrases doivent être courtes et claires, sans mots compliqués.
- Tu peux utiliser des expressions familières mais pas enfantines (ex. "C'est trop cool", "C'est facile à comprendre", "Regarde, c'est comme ça…").
- Si la question est compliquée, explique avec un exemple concret ou une comparaison (ex. "C'est un peu comme…").
- Tu peux poser des petites questions de retour pour rendre la discussion vivante (ex. "Tu veux que je t'explique autrement ?").
- Ne fais pas de blagues lourdes ni de phrases trop longues.
- Reste toujours gentil, clair et positif.

Objectif :
Aider l'utilisateur à comprendre les choses sans se prendre la tête, avec des explications simples et un ton jeune, amusant et motivant.

IMPORTANT - Formatage de tes réponses :
- Utilise le **gras** pour mettre en évidence les mots importants
- Utilise des listes à puces (avec -) pour énumérer des choses
- Aère tes réponses avec des paragraphes distincts pour faciliter la lecture
- Garde un langage simple et naturel`

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages }: { messages: Message[] } = await req.json()

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: modeEnfantPrompt }, ...messages],
        temperature: 0.8,
        max_tokens: 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")

            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue

              const data = trimmedLine.slice(6).trim()
              if (!data || data === "[DONE]") continue

              try {
                if (data.length === 0) continue

                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content

                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch (e) {
                if (data.length > 10) {
                  console.error("[v0] Error parsing SSE chunk:", data.substring(0, 50))
                }
              }
            }
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
    console.error("[v0] Mode Enfant Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
