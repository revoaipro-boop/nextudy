"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function VoiceRecordingPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const timerRef = useRef<NodeJS.Timeout>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/"
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = "fr-FR"

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + " "
          } else {
            interimTranscript += transcriptPiece
          }
        }

        setTranscript((prev) => prev + finalTranscript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
        toast({
          title: "Erreur d'enregistrement",
          description: "Impossible de transcrire l'audio",
          variant: "destructive",
        })
      }

      recognitionInstance.onend = () => {
        if (isRecording) {
          recognitionInstance.start()
        }
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [toast, isRecording])

  const startRecording = () => {
    if (!recognition) {
      toast({
        title: "Non supporté",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur",
        variant: "destructive",
      })
      return
    }

    setIsRecording(true)
    setRecordingTime(0)
    setTranscript("")
    recognition.start()

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)

    toast({
      title: "Enregistrement démarré",
      description: "Parlez maintenant...",
    })
  }

  const stopRecording = () => {
    if (recognition) {
      recognition.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleFinish = () => {
    if (transcript.trim().length === 0) {
      toast({
        title: "Aucun contenu",
        description: "Veuillez enregistrer quelque chose avant de terminer",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setProgressMessage("Traitement de l'enregistrement...")

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    setTimeout(() => {
      clearInterval(progressInterval)
      setProgress(100)
      setProgressMessage("Terminé!")

      // Store transcript in sessionStorage and redirect back
      sessionStorage.setItem("voiceTranscript", transcript)
      router.push(returnUrl)
    }, 1500)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href={returnUrl}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Annuler
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl py-12 px-4 sm:px-6">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Mic className="h-4 w-4" />
              Enregistrement vocal
            </div>
            <h1 className="text-4xl font-bold">Enregistrez votre voix</h1>
            <p className="text-lg text-muted-foreground">Parlez naturellement, nous transcrivons automatiquement</p>
          </div>

          <Card className="p-8 space-y-6">
            {/* Recording Status */}
            <div className="text-center space-y-4">
              <div
                className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isRecording ? "bg-red-500/20 animate-pulse" : transcript ? "bg-green-500/20" : "bg-muted"
                }`}
              >
                {isRecording ? (
                  <Mic className="h-16 w-16 text-red-500" />
                ) : transcript ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                ) : (
                  <MicOff className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              {isRecording && (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-red-500">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-muted-foreground">Enregistrement en cours...</p>
                </div>
              )}

              {!isRecording && transcript && (
                <p className="text-sm text-green-500 font-medium">Enregistrement terminé</p>
              )}

              {!isRecording && !transcript && <p className="text-sm text-muted-foreground">Prêt à enregistrer</p>}
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Transcription :</p>
                <div className="p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                  <p className="text-sm leading-relaxed">{transcript}</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {!isRecording ? (
                <>
                  <Button onClick={startRecording} className="flex-1 gap-2 py-6" size="lg" disabled={isProcessing}>
                    <Mic className="h-5 w-5" />
                    {transcript ? "Reprendre l'enregistrement" : "Commencer l'enregistrement"}
                  </Button>
                  {transcript && (
                    <Button
                      onClick={handleFinish}
                      variant="default"
                      className="gap-2 py-6"
                      size="lg"
                      disabled={isProcessing}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Terminer
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="flex-1 gap-2 py-6" size="lg">
                  <MicOff className="h-5 w-5" />
                  Arrêter l'enregistrement
                </Button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <p className="text-sm font-medium">Génération en cours...</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progressMessage}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Instructions */}
          <Card className="p-6 bg-accent/5">
            <h3 className="font-semibold mb-3">Conseils pour un bon enregistrement :</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Parlez clairement et à un rythme normal</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Évitez les bruits de fond</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Vous pouvez faire des pauses, la transcription continue</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Cliquez sur "Arrêter" quand vous avez terminé</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
