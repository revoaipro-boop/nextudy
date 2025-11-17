import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting transcription request")

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      console.error("[v0] No audio file provided")
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB
    if (audioFile.size > MAX_FILE_SIZE) {
      console.error("[v0] File too large:", audioFile.size)
      return NextResponse.json(
        {
          error: `Fichier audio trop volumineux (${(audioFile.size / 1024 / 1024).toFixed(1)} MB). La taille maximale est de 25 MB.`,
          details: "Veuillez utiliser un fichier audio plus court ou compressé.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Audio file received:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("[v0] GROQ_API_KEY not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    console.log("[v0] API key found, preparing audio for Groq Whisper")

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    console.log("[v0] Audio buffer created, size:", audioBuffer.length, "bytes")

    let mimeType = audioFile.type || "audio/webm"
    let extension = "webm"

    // Check magic bytes to detect actual audio format
    if (audioBuffer.length > 4) {
      const header = audioBuffer.slice(0, 4).toString("hex")
      if (header.startsWith("fffb") || header.startsWith("fff3")) {
        mimeType = "audio/mpeg"
        extension = "mp3"
      } else if (header === "52494646") {
        // RIFF (WAV)
        mimeType = "audio/wav"
        extension = "wav"
      } else if (header.startsWith("4f676753")) {
        // OggS
        mimeType = "audio/ogg"
        extension = "ogg"
      } else if (header.startsWith("1a45dfa3")) {
        // EBML (webm)
        mimeType = "audio/webm"
        extension = "webm"
      }
    }

    console.log("[v0] Detected audio format:", mimeType)

    // Create form data for Groq Whisper API
    const groqFormData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: mimeType })
    groqFormData.append("file", audioBlob, `audio.${extension}`)
    groqFormData.append("model", "whisper-large-v3-turbo")
    groqFormData.append("response_format", "json")
    groqFormData.append("temperature", "0")
    groqFormData.append("language", "fr") // Force French language

    console.log("[v0] Calling Groq Whisper API with audio size:", audioBuffer.length, "bytes")

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      let errorText = ""
      let errorMessage = ""

      try {
        // Try to read as text first
        errorText = await response.text()
        console.error("[v0] Groq API error:", response.status, errorText)

        // Try to parse as JSON if content-type indicates JSON
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error?.message || errorData.error || errorText
          } catch (jsonError) {
            errorMessage = errorText
          }
        } else {
          errorMessage = errorText
        }
      } catch (readError) {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`
      }

      // Handle specific error cases
      if (response.status === 413 || errorMessage.toLowerCase().includes("too large")) {
        return NextResponse.json(
          {
            error: `Fichier audio trop volumineux (${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB). La taille maximale supportée est de 25 MB.`,
            details: "Essayez d'utiliser un fichier audio plus court ou compressé.",
          },
          { status: 413 },
        )
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: "Clé API Groq invalide. Veuillez vérifier votre configuration." },
          { status: 500 },
        )
      }

      if (response.status === 400) {
        return NextResponse.json(
          {
            error: "Format audio non supporté ou fichier corrompu.",
            details: "Essayez un autre fichier audio.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: `Erreur de transcription: ${errorMessage}`,
          details: "Veuillez réessayer.",
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Transcription successful, text length:", data.text?.length || 0)

    if (!data.text || data.text.trim().length === 0) {
      console.error("[v0] Empty transcription received")
      return NextResponse.json(
        { error: "La transcription est vide. Vérifiez que l'audio contient de la parole." },
        { status: 400 },
      )
    }

    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error("[v0] Transcription error:", error)
    if (error instanceof Error) {
      console.error("[v0] Error details:", {
        message: error.message,
        stack: error.stack,
      })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la transcription" },
      { status: 500 },
    )
  }
}
