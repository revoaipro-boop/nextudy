import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting audio transcription request")

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      console.log("[v0] No audio file provided")
      return NextResponse.json({ error: "Aucun fichier audio fourni" }, { status: 400 })
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

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("[v0] File converted to buffer, size:", buffer.length)

    let mimeType = audioFile.type
    if (!mimeType || mimeType === "application/octet-stream") {
      // Detect from file extension
      const extension = audioFile.name.split(".").pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        m4a: "audio/mp4",
        ogg: "audio/ogg",
        webm: "audio/webm",
        flac: "audio/flac",
      }
      mimeType = mimeMap[extension || ""] || "audio/mpeg"
    }

    const groqFile = new File([buffer], audioFile.name, {
      type: mimeType,
    })

    try {
      console.log("[v0] Calling Groq Whisper API")

      // Use Groq's Whisper API for transcription
      const transcription = await groq.audio.transcriptions.create({
        file: groqFile,
        model: "whisper-large-v3",
        response_format: "json",
        temperature: 0.0,
      })

      console.log("[v0] Transcription successful, text length:", transcription.text?.length || 0)

      if (!transcription.text) {
        console.log("[v0] No text in transcription response")
        return NextResponse.json({ error: "Impossible de transcrire l'audio" }, { status: 400 })
      }

      return NextResponse.json({ text: transcription.text })
    } catch (groqError: any) {
      console.error("[v0] Groq API error:", {
        message: groqError.message,
        status: groqError.status,
        code: groqError.code,
        type: groqError.type,
      })

      if (groqError.status === 400) {
        return NextResponse.json(
          { error: "Format audio non supporté. Utilisez MP3, WAV, M4A, OGG ou WEBM" },
          { status: 400 },
        )
      }

      if (groqError.status === 429) {
        return NextResponse.json(
          { error: "Limite de taux atteinte. Veuillez réessayer dans quelques secondes" },
          { status: 429 },
        )
      }

      return NextResponse.json(
        {
          error: "Erreur lors de la transcription",
          details: groqError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Transcription error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        error: "Erreur lors de la transcription de l'audio",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
