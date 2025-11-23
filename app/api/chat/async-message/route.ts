export const maxDuration = 300 // 5 minutes max

import { createClient } from "@/lib/supabase/server"
import { createGenerationTask, updateTaskContent, markTaskFailed } from "@/lib/generation-tasks"
import { streamText } from "ai"

// Import the same helper functions from the main chat route
function addContextualEmojis(text: string, subject: string): string {
  let processedText = text

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

  processedText = processedText.replace(/\b(formule|équation)\b/gi, "📐 $1")
  processedText = processedText.replace(/\b(théorème|loi)\b/gi, "📏 $1")
  processedText = processedText.replace(/\b(exercice|pratique)\b/gi, "✏️ $1")
  processedText = processedText.replace(/\b(résultat|solution)\b/gi, "✨ $1")
  processedText = processedText.replace(/\b(erreur|faute)\b/gi, "❌ $1")

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

const baseNextudyPrompt = `Tu es Nextudy, un assistant pédagogique intelligent... [same as chat/route.ts]`

const subjectPrompts: Record<string, (grade: string) => string> = {
  // Same as in chat/route.ts
  Mathématiques: (grade) => `${baseNextudyPrompt}\n\nTu es un professeur de mathématiques...`,
  // ... copy all other subjects
}

async function generateResponseInBackground(taskId: string, task: any) {
  try {
    console.log(`[v0] Starting background generation for task ${taskId}`)
    
    const promptGenerator = subjectPrompts[task.subject] || subjectPrompts["Autre"]
    let systemPrompt = promptGenerator(task.grade)

    if (task.format === "kid") {
      systemPrompt += `\n\nIMPORTANT: Tu es en MODE ENFANT...`
    } else if (task.format === "correction") {
      systemPrompt += `\n\nIMPORTANT: Tu es en MODE CORRECTION...`
    }

    const result = await streamText({
      model: "google/gemini-2.0-flash",
      system: systemPrompt,
      messages: task.messages_context,
      temperature: 0.7,
      maxTokens: 2000,
    })

    let fullContent = ""
    let buffer = ""
    let lastUpdate = Date.now()

    for await (const chunk of result.textStream) {
      buffer += chunk
      fullContent += chunk

      // Update database every 200ms or when buffer reaches 50 characters
      const now = Date.now()
      if (buffer.length >= 50 || now - lastUpdate >= 200) {
        const processedContent = addContextualEmojis(fullContent, task.subject)
        await updateTaskContent(taskId, processedContent, false)
        buffer = ""
        lastUpdate = now
      }
    }

    // Final update
    const finalProcessedContent = addContextualEmojis(fullContent, task.subject)
    await updateTaskContent(taskId, finalProcessedContent, true)
    
    console.log(`[v0] Completed background generation for task ${taskId}`)
  } catch (error: any) {
    console.error(`[v0] Error in background generation for task ${taskId}:`, error)
    await markTaskFailed(taskId, error.message || "Unknown error")
  }
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

    const { messageId, conversationId, messages, subject, grade, format } = await req.json()

    if (!messageId || !messages || !subject || !grade || !format) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create the generation task
    const taskId = await createGenerationTask(
      user.id,
      messageId,
      conversationId,
      subject,
      grade,
      format,
      messages.slice(-10) // Only last 10 messages for context
    )

    // Start generation in background (don't await)
    const task = {
      subject,
      grade,
      format,
      messages_context: messages.slice(-10),
    }
    
    // Fire and forget - this continues even if client disconnects
    generateResponseInBackground(taskId, task).catch(console.error)

    return new Response(
      JSON.stringify({
        messageId,
        taskId,
        status: "generating",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("[v0] Error in async-message endpoint:", error)
    return new Response(JSON.stringify({ error: "Failed to create generation task" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
