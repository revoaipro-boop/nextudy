"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { SummaryOptions, type SummaryOptionsData } from "@/components/summary-options"
import { SimpleTextEditor } from "@/components/text-editor-simple"
import { storage } from "@/lib/storage"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>("")
  const [showOptions, setShowOptions] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [transcribedText, setTranscribedText] = useState<string>("")
  const [pendingOptions, setPendingOptions] = useState<SummaryOptionsData | null>(null)
  const [fileData, setFileData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [subject, setSubject] = useState<string>("")
  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [currentProgress, setCurrentProgress] = useState<number>(0)
  const [progressMessage, setProgressMessage] = useState<string>("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const supabase = createClient()
  const progressBarRef = useRef<HTMLDivElement>(null)

  const type = searchParams.get("type") // 'document' or 'audio'

  useEffect(() => {
    const storedData = sessionStorage.getItem("processingData")

    if (!storedData) {
      router.push("/")
      return
    }

    try {
      const data = JSON.parse(storedData)
      console.log("[v0] Loaded processing data:", {
        filename: data.filename,
        hasText: !!data.text,
        textLength: data.text?.length || 0,
        hasAudioKey: !!data.audioKey,
      })
      setFileData(data)

      if (data.audioKey) {
        const openRequest = indexedDB.open("AudioStorage", 1)

        openRequest.onsuccess = () => {
          const db = openRequest.result
          const transaction = db.transaction("audioFiles", "readonly")
          const store = transaction.objectStore("audioFiles")
          const getRequest = store.get(data.audioKey)

          getRequest.onsuccess = () => {
            if (getRequest.result) {
              console.log("[v0] Retrieved audio blob from IndexedDB, size:", getRequest.result.size)
              setAudioBlob(getRequest.result)
            } else {
              console.error("[v0] Audio blob not found in IndexedDB")
              setError("Fichier audio introuvable. Veuillez réessayer.")
            }
          }

          getRequest.onerror = () => {
            console.error("[v0] Error retrieving audio from IndexedDB")
            setError("Erreur lors de la récupération du fichier audio")
          }
        }

        openRequest.onerror = () => {
          console.error("[v0] Error opening IndexedDB")
          setError("Erreur lors de l'ouverture du stockage")
        }
      }
    } catch (parseError) {
      console.error("[v0] Failed to parse sessionStorage data:", parseError)
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (!fileData) return

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsCheckingAuth(false)

      if (!user) {
        sessionStorage.setItem("returnAfterLogin", "processing")
        router.push("/auth/login")
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [fileData, supabase.auth, router])

  useEffect(() => {
    if (isProcessing && progressBarRef.current) {
      progressBarRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [isProcessing])

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const processResponse = async (response: Response) => {
    if (!response.ok) {
      const responseText = await response.text()
      let errorMessage = "Erreur lors de la génération du résumé"
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.details || errorData.error || errorMessage
      } catch (jsonError) {
        errorMessage = `Erreur serveur: ${responseText.substring(0, 100)}`
      }
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Impossible de lire la réponse du serveur")
    }

    const decoder = new TextDecoder()
    let buffer = ""
    let finalResults: any = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const event = JSON.parse(data)

              if (event.type === "progress") {
                console.log("[v0] Progress:", event.step, "-", event.progress + "%")
                setCurrentProgress(event.progress)
                setProgressMessage(event.step)
              } else if (event.type === "complete") {
                finalResults = event.results
                console.log("[v0] Generation complete")
                setCurrentProgress(100)
                setProgressMessage("Génération terminée")
              } else if (event.type === "error") {
                throw new Error(event.error || "Erreur lors de la génération")
              }
            } catch (parseError) {
              console.error("[v0] Failed to parse SSE event:", parseError)
            }
          }
        }
      }

      if (!finalResults) {
        throw new Error("Aucun résultat reçu du serveur")
      }

      return finalResults
    } catch (streamError) {
      console.error("[v0] Error reading stream:", streamError)
      throw new Error("Erreur lors de la lecture de la réponse du serveur")
    }
  }

  const handleOptionsSubmit = async (options: SummaryOptionsData) => {
    if (!fileData) return

    if (options.editBeforeSummarize && type === "document") {
      if (fileData.text) {
        setTranscribedText(fileData.text)
        setPendingOptions(options)
        setShowOptions(false)
        setShowEditor(true)
      } else {
        setError("Aucun texte disponible pour l'édition.")
        setTimeout(() => {
          setError("")
        }, 2000)
      }
    } else if (options.editBeforeSummarize && type === "audio") {
      setShowOptions(false)
      await transcribeAudio(options)
    } else {
      await handleProcess(options)
    }
  }

  const transcribeAudio = async (options: SummaryOptionsData) => {
    setIsProcessing(true)
    setError("")

    try {
      if (!audioBlob) {
        throw new Error("Fichier audio non disponible")
      }

      console.log("[v0] Transcribing audio, size:", audioBlob.size)

      const audioFile = new File([audioBlob], fileData.filename || "audio.webm", {
        type: audioBlob.type || "audio/webm",
      })

      const formData = new FormData()
      formData.append("audio", audioFile)

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcribeResponse.ok) {
        let errorMessage = "Erreur lors de la transcription audio"
        let errorDetails = ""

        try {
          const contentType = transcribeResponse.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await transcribeResponse.json()
            errorMessage = errorData.error || errorMessage
            errorDetails = errorData.details || ""
          } else {
            const errorText = await transcribeResponse.text()
            errorMessage = errorText || `Erreur ${transcribeResponse.status}: ${transcribeResponse.statusText}`
          }
        } catch (parseError) {
          console.error("[v0] Error parsing error response:", parseError)
          errorMessage = `Erreur ${transcribeResponse.status}: ${transcribeResponse.statusText}`
        }

        throw new Error(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage)
      }

      const transcribeData = await transcribeResponse.json()
      setTranscribedText(transcribeData.text)
      setPendingOptions(options)
      setShowEditor(true)
      setIsProcessing(false)
    } catch (err) {
      console.error("[v0] Error in transcribe:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsProcessing(false)
      setShowOptions(true)
    }
  }

  const handleTextSave = async (editedText: string) => {
    setTranscribedText(editedText)
    setShowEditor(false)
    setShowOptions(true)

    if (fileData) {
      setFileData({
        ...fileData,
        text: editedText,
      })
    }

    if (pendingOptions) {
      await handleProcess(pendingOptions, editedText)
    }
  }

  const handleProcess = async (options: SummaryOptionsData, customText?: string) => {
    if (!user) {
      sessionStorage.setItem("returnAfterLogin", "processing")
      router.push("/auth/login")
      return
    }

    setIsProcessing(true)
    setError("")
    setCurrentProgress(0)
    setProgressMessage("")

    try {
      let textToSummarize = customText

      if (type === "audio" && !textToSummarize) {
        if (!audioBlob) {
          throw new Error("Fichier audio non disponible")
        }

        console.log("[v0] Transcribing audio, size:", audioBlob.size)

        const audioFile = new File([audioBlob], fileData.filename || "audio.webm", {
          type: audioBlob.type || "audio/webm",
        })

        const formData = new FormData()
        formData.append("audio", audioFile)

        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (!transcribeResponse.ok) {
          let errorMessage = "Erreur lors de la transcription audio"
          let errorDetails = ""

          try {
            const contentType = transcribeResponse.headers.get("content-type")
            if (contentType && contentType.includes("application/json")) {
              const errorData = await transcribeResponse.json()
              errorMessage = errorData.error || errorMessage
              errorDetails = errorData.details || ""
            } else {
              const errorText = await transcribeResponse.text()
              errorMessage = errorText || `Erreur ${transcribeResponse.status}: ${transcribeResponse.statusText}`
            }
          } catch (parseError) {
            console.error("[v0] Error parsing error response:", parseError)
            errorMessage = `Erreur ${transcribeResponse.status}: ${transcribeResponse.statusText}`
          }

          throw new Error(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage)
        }

        const transcribeData = await transcribeResponse.json()
        textToSummarize = transcribeData.text
      }

      let requestBody: any

      if (type === "audio" || textToSummarize) {
        requestBody = {
          file: {
            text: textToSummarize,
            mediaType: "text/plain",
            filename: fileData.filename || "transcription.txt",
          },
          options,
        }
      } else if (type === "document") {
        if (fileData.text && fileData.text.trim().length > 0) {
          requestBody = {
            file: {
              text: fileData.text,
              mediaType: "text/plain",
              filename: fileData.filename,
            },
            options,
          }
        } else if (fileData.data) {
          requestBody = {
            file: {
              data: fileData.data.split(",")[1],
              mediaType: fileData.mediaType || "application/octet-stream",
              filename: fileData.filename,
            },
            options,
          }
        } else {
          throw new Error("Le texte du document n'a pas pu être chargé. Veuillez réessayer.")
        }
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await processResponse(response)

      const originalText = textToSummarize || fileData.text || ""

      const savedSummary = await storage.saveSummary({
        filename: options.customName || fileData.filename,
        summary: data.summary || "",
        shortSummary: data.shortSummary,
        keywords: data.keywords,
        flashcards: data.flashcards || [],
        qcm: data.qcm || [],
        subject: options.subject,
        type: type === "audio" ? "audio" : "document",
        textContent: originalText,
      })

      try {
        await fetch("/api/achievements/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: "summary",
            description: `Résumé créé: ${options.customName || fileData.filename}`,
          }),
        })
      } catch (pointsError) {
        console.error("Error awarding points:", pointsError)
      }

      playNotificationSound()

      sessionStorage.removeItem("processingData")
      sessionStorage.removeItem("processingFile")

      if (fileData.audioKey) {
        const openRequest = indexedDB.open("AudioStorage", 1)
        openRequest.onsuccess = () => {
          const db = openRequest.result
          const transaction = db.transaction("audioFiles", "readwrite")
          const store = transaction.objectStore("audioFiles")
          store.delete(fileData.audioKey)
        }
      }

      router.push(`/results/${savedSummary.id}`)
    } catch (err) {
      console.error("[v0] Error in handleProcess:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsProcessing(false)
      setCurrentProgress(0)
      setProgressMessage("")
    }
  }

  const getProgressStages = () => {
    const stages = []
    if (type === "audio") {
      stages.push("Transcription de l'audio...")
    } else {
      stages.push("Lecture du document...")
    }
    if (pendingOptions?.generateLongSummary) stages.push("Génération du contenu structuré...")
    if (pendingOptions?.generateShortSummary) stages.push("Génération de la fiche de révision...")
    if (pendingOptions?.generateKeywords) stages.push("Extraction des mots-clés et définitions...")
    if (pendingOptions?.generateFlashcards) stages.push("Création des flashcards...")
    stages.push("Finalisation...")
    return stages
  }

  if (!fileData || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isCheckingAuth ? "Vérification de l'authentification..." : "Chargement..."}
          </p>
        </div>
      </div>
    )
  }

  if (showEditor && transcribedText) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Éditer la transcription</h3>
                  <p className="text-sm text-muted-foreground">
                    Corrigez les erreurs de transcription avant de générer le résumé
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditor(false)
                    setShowOptions(true)
                    setPendingOptions(null)
                  }}
                >
                  Annuler
                </Button>
              </div>
              <SimpleTextEditor
                initialText={transcribedText}
                filename={fileData.filename}
                onSave={handleTextSave}
                onCancel={() => {
                  setShowEditor(false)
                  setShowOptions(true)
                  setPendingOptions(null)
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Traitement de votre fichier</h1>
            <p className="text-muted-foreground">{fileData.filename}</p>
          </div>

          {showOptions && (
            <SummaryOptions
              onGenerate={handleOptionsSubmit}
              onCancel={() => router.push("/")}
              isProcessing={isProcessing}
              fileType={type || undefined}
              progress={currentProgress}
              progressMessage={progressMessage}
              onSubjectChange={(newSubject) => setSubject(newSubject)}
              onSelectionChange={(newSelection) => setHasSelection(newSelection)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  )
}
