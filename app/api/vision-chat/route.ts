export const maxDuration = 30

const visionSystemPrompt = `Tu es Nextudy Vision, un assistant pédagogique intelligent capable d'analyser des images et des documents.

Ton rôle est d'aider les élèves à comprendre :
- Des schémas, graphiques et diagrammes
- Des exercices manuscrits ou imprimés
- Des formules mathématiques et scientifiques
- Des cartes géographiques et historiques
- Des œuvres d'art et documents visuels

Tu dois :
1. Analyser précisément ce que tu vois dans l'image
2. Expliquer clairement les concepts visuels
3. Répondre aux questions sur le contenu de l'image
4. Proposer des explications pédagogiques adaptées

Utilise le **gras** pour les concepts clés et structure tes réponses de manière claire.`

interface Message {
  role: "user" | "assistant" | "system"
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export async function POST(req: Request) {
  try {
    const { messages, image }: { messages: Message[]; image?: string } = await req.json()

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("[v0] GROQ_API_KEY is not configured")
      return new Response(JSON.stringify({ error: "API configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Build messages with image if provided
    const apiMessages: Message[] = [{ role: "system", content: visionSystemPrompt }]

    if (image) {
      // Add the image to the last user message
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage && lastUserMessage.role === "user") {
        apiMessages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: typeof lastUserMessage.content === "string" ? lastUserMessage.content : "",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        })
      }
    } else {
      apiMessages.push(...messages)
    }

    console.log("[v0] Calling Llama 4 Vision API...")

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      console.error("[v0] Groq API error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("[v0] Error details:", errorText)
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
                // Ignore parsing errors
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
    console.error("[v0] Vision chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process vision chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
