import type { NextRequest } from "next/server"
import { streamText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request body", { status: 400 })
    }

    const systemPrompt = `Tu es un assistant IA rapide et efficace. Tu réponds de manière concise et directe aux questions, sans contexte de matière spécifique. 

Caractéristiques de tes réponses :
- Concises et directes
- Claires et faciles à comprendre
- Adaptées à tous les niveaux
- Factuelles et précises
- Amicales mais professionnelles

Tu peux répondre à n'importe quelle question générale, qu'elle soit académique, pratique ou informative.`

    const result = await streamText({
      model: "google/gemini-2.0-flash", // Switched from OpenAI to Gemini 2.0 Flash
      system: systemPrompt,
      messages: messages as any,
      temperature: 0.7,
      maxTokens: 1024,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const sseData = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(sseData))
          }
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
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
    console.error("[v0] Quick chat error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
