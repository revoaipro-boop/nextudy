"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, AlertCircle, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string>("")
  const [audioSource, setAudioSource] = useState<"recorded" | "uploaded">("recorded")
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsCheckingAuth(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("audio/")) {
      setError("Veuillez sélectionner un fichier audio valide")
      return
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). La taille maximale est de 25 MB.`,
      )
      return
    }

    console.log("[v0] Audio file uploaded:", file.name, file.type, file.size)
    setAudioBlob(file)
    setAudioSource("uploaded")
    setUploadedFileName(file.name)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    setError("")

    redirectToProcessing(file, "uploaded", file.name)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      setAudioLevel(0)
      setIsSpeaking(false)
    }
  }

  const startRecording = async () => {
    if (!user) {
      sessionStorage.setItem("returnAfterLogin", "record-audio")
      router.push("/auth/login")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8 // Smoother visualization
      source.connect(analyserRef.current)

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      const VOICE_THRESHOLD = 35 // Increased threshold for better detection

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setAudioLevel(average)
          setIsSpeaking(average > VOICE_THRESHOLD)
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }

      updateAudioLevel()

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())

        redirectToProcessing(blob, "recorded", "Enregistrement audio")
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setError("")

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("[v0] Error starting recording:", err)
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.")
    }
  }

  const redirectToProcessing = async (blob: Blob, source: "recorded" | "uploaded", filename: string) => {
    try {
      // Store in IndexedDB
      const openRequest = indexedDB.open("AudioStorage", 1)

      openRequest.onupgradeneeded = () => {
        const db = openRequest.result
        if (!db.objectStoreNames.contains("audioFiles")) {
          db.createObjectStore("audioFiles")
        }
      }

      openRequest.onsuccess = () => {
        const db = openRequest.result
        const transaction = db.transaction("audioFiles", "readwrite")
        const store = transaction.objectStore("audioFiles")

        // Store the blob with a temporary key
        const audioKey = "temp_audio_" + Date.now()
        store.put(blob, audioKey)

        transaction.oncomplete = () => {
          // Store only the key and metadata in sessionStorage
          sessionStorage.setItem(
            "processingData",
            JSON.stringify({
              filename: filename,
              audioKey: audioKey,
              source: source,
            }),
          )
          router.push("/processing?type=audio")
        }

        transaction.onerror = () => {
          console.error("[v0] IndexedDB transaction error")
          setError("Erreur lors du stockage du fichier audio")
        }
      }

      openRequest.onerror = () => {
        console.error("[v0] IndexedDB open error")
        setError("Erreur lors de l'ouverture du stockage")
      }
    } catch (err) {
      console.error("[v0] Error storing audio:", err)
      setError("Erreur lors du stockage du fichier audio")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (audioBlob) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="border-2 transition-all duration-300 border-border hover:border-black/50">
          <div className="p-12 text-center space-y-4">
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-black/5 flex items-center justify-center animate-scale-in">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2 animate-fade-in">
                <p className="text-lg font-medium">Redirection...</p>
                <p className="text-sm text-muted-foreground">Préparation du traitement</p>
              </div>
            </>
          </div>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5 animate-scale-in">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Erreur</p>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="border-2 transition-all duration-300 border-border hover:border-black/50">
        <div className="p-12 text-center space-y-4">
          {!audioBlob ? (
            <>
              <div className="relative">
                <div
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording ? "bg-destructive/20 scale-110" : "bg-black/5"
                  }`}
                >
                  {isRecording ? <Square className="h-8 w-8 text-destructive" /> : <Mic className="h-8 w-8 text-white" />}
                </div>
                
                {isRecording && (
                  <>
                    <div className="absolute inset-0 mx-auto w-16 h-16 rounded-full bg-destructive/30 animate-ping" />
                    <div className="absolute inset-0 mx-auto w-16 h-16 rounded-full bg-destructive/20 animate-pulse" />
                  </>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center justify-center gap-1 h-16">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                    // Calculate height based on audio level
                    const baseHeight = 16
                    const maxHeight = 48
                    const voiceMultiplier = isSpeaking ? (audioLevel / 255) * 2 : 0
                    const barHeight = Math.min(baseHeight + voiceMultiplier * (maxHeight - baseHeight), maxHeight)
                    
                    return (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-destructive rounded-full"
                        animate={{
                          height: barHeight,
                        }}
                        transition={{
                          duration: 0.15,
                          ease: "easeOut"
                        }}
                      />
                    )
                  })}
                </div>
              )}

              <div className="space-y-2">
                {isRecording ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                      </span>
                      <p className="text-lg font-medium text-destructive">Enregistrement en cours...</p>
                    </div>
                    <p className="text-2xl font-mono text-black font-bold">{formatTime(recordingTime)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">Enregistrer ou importer un audio</p>
                    <p className="text-sm text-muted-foreground">Enregistrez votre voix ou importez un fichier</p>
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  disabled={isCheckingAuth}
                  className="transition-all duration-300"
                >
                  {isRecording ? (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Arrêter
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      {isCheckingAuth ? "Chargement..." : "Enregistrer"}
                    </>
                  )}
                </Button>

                {!isRecording && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="audio-upload"
                      disabled={!user || isCheckingAuth}
                    />
                    <Button
                      onClick={() => {
                        if (!user && !isCheckingAuth) {
                          sessionStorage.setItem("returnAfterLogin", "import-audio")
                          router.push("/auth/login")
                        } else {
                          fileInputRef.current?.click()
                        }
                      }}
                      size="lg"
                      variant="outline"
                      disabled={isCheckingAuth}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isCheckingAuth ? "Chargement..." : "Importer"}
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-black/5 flex items-center justify-center animate-scale-in">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2 animate-fade-in">
                <p className="text-lg font-medium">Redirection...</p>
                <p className="text-sm text-muted-foreground">Préparation du traitement</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 animate-scale-in">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Erreur</p>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
