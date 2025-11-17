"use client"

import type React from "react"
import { extractPDFText } from "@/lib/pdf-extractor"
import { SummaryOptions } from "@/components/summary-options"

import { useState, useCallback, useEffect, useRef } from "react"
import { Upload, FileText, AlertCircle, X, Loader2, Camera, Flashlight, FlashlightOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { SummaryOptionsData } from "@/components/summary-options"
import { SimpleTextEditor } from "@/components/text-editor-simple"
import { storage } from "@/lib/storage"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/rtf": [".rtf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
}

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf", ".jpg", ".jpeg", ".png", ".webp"]

interface UploadedFile {
  id: string
  file: File
  preview?: string
  type: "document" | "image"
  extractedText?: string
}

export function PDFUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [fileText, setFileText] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string>("")
  const [showOptions, setShowOptions] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [pendingOptions, setPendingOptions] = useState<SummaryOptionsData | null>(null)
  const [currentFileType, setCurrentFileType] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [progressMessage, setProgressMessage] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [flashSupported, setFlashSupported] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()
  const router = useRouter()

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

  const isValidFileType = (file: File) => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase()
    const mimeType = file.type.toLowerCase()

    console.log("[v0] Validating file:", file.name, "Extension:", extension, "MIME:", mimeType)

    // Check if it's an image file by extension or MIME type
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"]
    const isImageByExtension = imageExtensions.includes(extension)
    const isImageByMime = mimeType.startsWith("image/")

    if (isImageByExtension || isImageByMime) {
      console.log("[v0] File accepted as image:", file.name)
      return true
    }

    // Check other accepted extensions
    const isValidExtension = ACCEPTED_EXTENSIONS.includes(extension)
    const isValidMimeType = Object.keys(ACCEPTED_FILE_TYPES).includes(mimeType)

    const isValid = isValidExtension || isValidMimeType
    console.log(
      "[v0] File validation result:",
      isValid,
      "Extension valid:",
      isValidExtension,
      "MIME valid:",
      isValidMimeType,
    )

    return isValid
  }

  const checkAuthAndProceed = (callback: () => void) => {
    if (!user) {
      sessionStorage.setItem("returnAfterLogin", "upload-document")
      router.push("/auth/login")
      return false
    }
    callback()
    return true
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (!user) {
        sessionStorage.setItem("returnAfterLogin", "upload-document")
        router.push("/auth/login")
        return
      }

      const droppedFiles = Array.from(e.dataTransfer.files)
      const validFiles: UploadedFile[] = []
      const invalidFiles: string[] = []

      setIsProcessing(true)
      setUploadProgress(10)
      setError("") // Clear any previous errors

      try {
        for (let i = 0; i < droppedFiles.length; i++) {
          const file = droppedFiles[i]
          setUploadProgress(10 + (i / droppedFiles.length) * 80)

          console.log("[v0] Processing dropped file:", file.name, file.type)

          if (isValidFileType(file)) {
            const uploadedFile: UploadedFile = {
              id: Date.now().toString() + Math.random(),
              file,
              type: file.type.startsWith("image/") ? "image" : "document",
            }

            if (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
              // Wait for image preview to load
              const preview = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                  resolve(e.target?.result as string)
                }
                reader.readAsDataURL(file)
              })
              uploadedFile.preview = preview

              uploadedFile.extractedText = ""
              console.log("[v0] Image accepted without OCR (temporarily disabled)")

              validFiles.push(uploadedFile)
            } else if (file.type === "application/pdf") {
              try {
                console.log("[v0] Extracting PDF text for:", file.name)
                const text = await extractPDFText(file)
                console.log("[v0] PDF extraction successful, text length:", text.length)
                uploadedFile.extractedText = text
                validFiles.push(uploadedFile)
              } catch (error) {
                console.error("[v0] PDF extraction error:", error)
                validFiles.push(uploadedFile)
              }
            } else {
              validFiles.push(uploadedFile)
            }
          } else {
            console.log("[v0] File rejected:", file.name)
            invalidFiles.push(file.name)
          }
        }

        if (validFiles.length > 0) {
          setFiles((prev) => [...prev, ...validFiles])
        }

        if (invalidFiles.length > 0) {
          setError(
            `Fichiers non pris en charge : ${invalidFiles.join(", ")}. Formats acceptés : PDF, Word, TXT, Markdown, RTF, Images (JPG, JPEG, PNG, WEBP)`,
          )
        } else if (validFiles.length > 0) {
          setError("")
        }
      } finally {
        setUploadProgress(100)
        setTimeout(() => {
          setIsProcessing(false)
          setUploadProgress(0)
        }, 500)
        console.log("[v0] File processing completed")
      }
    },
    [user, router],
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      const validFiles: UploadedFile[] = []
      const invalidFiles: string[] = []

      setIsProcessing(true)
      setUploadProgress(10)
      setError("")

      try {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          setUploadProgress(10 + (i / selectedFiles.length) * 80)

          console.log("[v0] Processing selected file:", file.name, file.type)

          if (isValidFileType(file)) {
            const uploadedFile: UploadedFile = {
              id: Date.now().toString() + Math.random(),
              file,
              type: file.type.startsWith("image/") ? "image" : "document",
            }

            if (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
              // Wait for image preview to load
              const preview = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                  resolve(e.target?.result as string)
                }
                reader.readAsDataURL(file)
              })
              uploadedFile.preview = preview
              uploadedFile.extractedText = "" // Pas de texte extrait, l'image sera envoyée directement à l'API
              validFiles.push(uploadedFile)
            } else if (file.type === "application/pdf") {
              try {
                console.log("[v0] Extracting PDF text for:", file.name)
                const text = await extractPDFText(file)
                console.log("[v0] PDF extraction successful, text length:", text.length)
                uploadedFile.extractedText = text
                validFiles.push(uploadedFile)
              } catch (error) {
                console.error("[v0] PDF extraction error:", error)
                validFiles.push(uploadedFile)
              }
            } else {
              validFiles.push(uploadedFile)
            }
          } else {
            console.log("[v0] File rejected:", file.name)
            invalidFiles.push(file.name)
          }
        }

        if (validFiles.length > 0) {
          setFiles((prev) => [...prev, ...validFiles])
        }

        if (invalidFiles.length > 0) {
          setError(
            `Fichiers non pris en charge : ${invalidFiles.join(", ")}. Formats acceptés : PDF, Word, TXT, Markdown, RTF, Images (JPG, JPEG, PNG, WEBP)`,
          )
        } else if (validFiles.length > 0) {
          setError("")
        }
      } finally {
        setUploadProgress(100)
        setTimeout(() => {
          setIsProcessing(false)
          setUploadProgress(0)
        }, 500)
        console.log("[v0] File processing completed")
      }
    },
    [router],
  )

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const processFiles = () => {
    if (files.length === 0 || isProcessing) return
    setIsProcessing(true)
    redirectToProcessing(files[0].file)
  }

  const processResponse = async (response: Response) => {
    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = "Erreur lors de la génération du résumé"
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.details || errorData.error || errorMessage
      } catch (jsonError) {
        errorMessage = `Erreur serveur: ${responseText.substring(0, 100)}`
      }
      throw new Error(errorMessage)
    }

    try {
      const data = JSON.parse(responseText)
      return data
    } catch (jsonError) {
      throw new Error("Réponse invalide du serveur")
    }
  }

  const handleOptionsSubmit = async (options: SummaryOptionsData) => {
    if (files.length === 0) return

    const optionsFile = files[0]
    const file = optionsFile.file

    if (options.editBeforeSummarize) {
      const isTextFile =
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md")

      if (file.type === "application/pdf") {
        try {
          setIsProcessing(true)
          const text = await extractPDFText(file)
          setFileText(text)
          setPendingOptions(options)
          setShowOptions(false)
          setShowEditor(true)
        } catch (error) {
          setError("Erreur lors de l'extraction du PDF. Le fichier est peut-être corrompu.")
        } finally {
          setIsProcessing(false)
        }
      } else if (isTextFile) {
        const text = await file.text()
        setFileText(text)
        setPendingOptions(options)
        setShowOptions(false)
        setShowEditor(true)
      } else {
        setError(
          "L'édition avant résumé n'est disponible que pour les fichiers texte (.txt, .md) et PDF. Les documents Word seront traités directement.",
        )
      }
    } else {
      await handleSummarize(options)
    }
  }

  const handleTextSave = (editedText: string) => {
    setFileText(editedText)
    setShowEditor(false)
    setShowOptions(false)
    if (pendingOptions) {
      handleSummarize(pendingOptions, editedText)
    }
  }

  const handleSummarize = async (options: SummaryOptionsData, customText?: string) => {
    if (files.length === 0) return

    setIsProcessing(true)
    setError("")
    setUploadProgress(0)
    setProgressMessage("Initialisation...")

    try {
      const optionsFile = files[0]
      const file = optionsFile.file

      const isTextFile =
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md")

      let requestBody: any

      if (isTextFile || customText) {
        const text = customText || (await file.text())
        requestBody = {
          file: {
            text: text,
            mediaType: file.type || "text/plain",
            filename: file.name,
          },
          options,
        }
      } else if (file.type === "application/pdf") {
        const text = await extractPDFText(file)
        requestBody = {
          file: {
            text: text,
            mediaType: file.type || "application/pdf",
            filename: file.name,
          },
          options,
        }
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const base64Data = base64.split(",")[1]

        requestBody = {
          file: {
            data: base64Data,
            mediaType: file.type || "application/pdf",
            filename: file.name,
          },
          options,
        }
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la génération")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("Pas de réponse du serveur")
      }

      let results: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "progress") {
                setUploadProgress(Math.round(data.progress))
                setProgressMessage(data.step)
                console.log(`[v0] Progress: ${data.step} - ${data.progress}%`)
              } else if (data.type === "complete") {
                results = data.results
                setUploadProgress(100)
                setProgressMessage("Terminé !")
              } else if (data.type === "error") {
                throw new Error(data.error)
              }
            } catch (e) {
              console.error("[v0] Error parsing SSE data:", e)
            }
          }
        }
      }

      if (!results) {
        throw new Error("Aucune donnée reçue")
      }

      const savedSummary = await storage.saveSummary({
        filename: options.customName || file.name,
        summary: results.summary || "",
        shortSummary: results.shortSummary,
        keywords: results.keywords,
        flashcards: results.flashcards || [],
        qcm: results.qcm || [],
        subject: options.subject,
        type: "document",
      })

      router.push(`/results/${savedSummary.id}`)
    } catch (err) {
      console.error("[v0] Error in handleSummarize:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsProcessing(false)
      setUploadProgress(0)
      setProgressMessage("")
    }
  }

  const resetUploader = () => {
    setFiles([])
    setFileText("")
    setError("")
    setShowOptions(false)
    setShowEditor(false)
    setPendingOptions(null)
    setCurrentFileType("")
    setProgressMessage("") // Reset progress message
  }

  const getProgressStages = () => {
    const stages = ["Lecture du document..."]
    if (pendingOptions?.generateLongSummary) stages.push("Génération du contenu structuré...")
    if (pendingOptions?.generateShortSummary) stages.push("Génération de la fiche de révision...")
    if (pendingOptions?.generateKeywords) stages.push("Extraction des mots-clés et définitions...")
    if (pendingOptions?.generateFlashcards) stages.push("Création des flashcards...")
    stages.push("Finalisation...")
    return stages
  }

  const redirectToProcessing = async (file: File) => {
    try {
      const isTextFile =
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md")

      const isImageFile = file.type.startsWith("image/")
      const uploadedFileData = files.find((f) => f.file === file)

      if (isImageFile) {
        setCurrentFileType("image")
      } else if (file.type === "application/pdf") {
        setCurrentFileType("pdf")
      } else if (isTextFile) {
        setCurrentFileType("text")
      } else {
        setCurrentFileType("document")
      }

      if (file.type === "application/pdf") {
        try {
          console.log("[v0] Extracting PDF text before navigation:", file.name)
          const text = await extractPDFText(file)
          console.log("[v0] PDF extraction successful, text length:", text.length)

          sessionStorage.setItem(
            "processingData",
            JSON.stringify({
              filename: file.name,
              text: text,
              mediaType: file.type,
            }),
          )
          setShowOptions(true)
        } catch (error) {
          console.error("[v0] PDF extraction error:", error)
          setError(
            error instanceof Error
              ? error.message
              : "Erreur lors de l'extraction du PDF. Le fichier est peut-être corrompu.",
          )
        } finally {
          setIsProcessing(false)
        }
        return
      }

      if (isImageFile) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          sessionStorage.setItem(
            "processingData",
            JSON.stringify({
              filename: file.name,
              data: base64,
              mediaType: file.type,
            }),
          )
          setShowOptions(true)
          setIsProcessing(false)
        }
        reader.readAsDataURL(file)
        return
      }

      if (isTextFile) {
        const text = await file.text()
        sessionStorage.setItem(
          "processingData",
          JSON.stringify({
            filename: file.name,
            text: text,
            mediaType: file.type || "text/plain",
          }),
        )
      } else {
        sessionStorage.setItem(
          "processingData",
          JSON.stringify({
            filename: file.name,
            mediaType: file.type || "application/pdf",
          }),
        )

        sessionStorage.setItem(
          "processingFileInfo",
          JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
          }),
        )
      }
      setShowOptions(true)
      setIsProcessing(false)
    } catch (error) {
      console.error("[v0] Error in redirectToProcessing:", error)
      setError("Une erreur est survenue lors du traitement du fichier")
      setIsProcessing(false)
    }
  }

  const startCamera = async () => {
    if (!user && !isCheckingAuth) {
      sessionStorage.setItem("returnAfterLogin", "upload-document")
      router.push("/auth/login")
      return
    }

    try {
      console.log("[v0] Starting camera...")
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      console.log("[v0] Camera stream obtained")
      
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any
        const isFlashSupported = 'torch' in capabilities
        setFlashSupported(isFlashSupported)
        console.log("[v0] Flash supported:", isFlashSupported)
      }
      
      setStream(mediaStream)
      setShowCamera(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().catch((err) => {
            console.error("[v0] Error playing video:", err)
          })
          console.log("[v0] Video stream assigned to video element")
        }
      }, 100)
    } catch (err) {
      console.error("[v0] Error starting camera:", err)
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
    }
  }

  const stopCamera = () => {
    console.log("[v0] Stopping camera...")
    if (stream) {
      if (flashEnabled) {
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.applyConstraints({
            advanced: [{ torch: false } as any]
          }).catch(err => console.error("[v0] Error turning off flash:", err))
        }
      }
      
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] Camera track stopped")
      })
      setStream(null)
    }
    setShowCamera(false)
    setFlashEnabled(false)
  }

  const toggleFlash = async () => {
    if (!stream) {
      console.log("[v0] No stream available")
      return
    }
    
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) {
      console.log("[v0] No video track available")
      return
    }

    try {
      const capabilities = videoTrack.getCapabilities() as any
      console.log("[v0] Video track capabilities:", capabilities)
      
      if (!capabilities.torch) {
        console.log("[v0] Torch not available in capabilities")
        setError("Le flash n'est pas disponible sur cet appareil")
        setTimeout(() => setError(""), 3000)
        return
      }

      const newFlashState = !flashEnabled
      console.log("[v0] Attempting to set flash to:", newFlashState)
      
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashState } as any]
      })
      
      setFlashEnabled(newFlashState)
      console.log("[v0] Flash successfully toggled to:", newFlashState)
    } catch (err) {
      console.error("[v0] Error toggling flash:", err)
      setError("Erreur lors de l'activation du flash")
      setTimeout(() => setError(""), 3000)
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("[v0] Video or canvas ref not available")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    console.log("[v0] Capturing photo, video dimensions:", video.videoWidth, video.videoHeight)

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("[v0] Could not get canvas context")
      return
    }

    ctx.drawImage(video, 0, 0)
    console.log("[v0] Photo drawn to canvas")

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          console.error("[v0] Could not create blob from canvas")
          return
        }

        console.log("[v0] Photo blob created, size:", blob.size)
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" })
        const uploadedFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          file,
          type: "image",
          preview: URL.createObjectURL(blob),
          extractedText: "",
        }

        setFiles((prev) => [...prev, uploadedFile])
        console.log("[v0] Photo added to files")
        stopCamera()
      },
      "image/jpeg",
      0.95,
    ) // Added quality parameter
  }

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  if (showEditor && fileText) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Éditer le texte</h3>
                <p className="text-sm text-muted-foreground">Modifiez le contenu avant de générer le résumé</p>
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
              initialText={fileText}
              filename={files[0]?.file.name || ""}
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
    )
  }

  if (showOptions) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="border-b border-border/40 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowOptions(false)
              setIsProcessing(false)
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Annuler
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <SummaryOptions
              onGenerate={handleOptionsSubmit}
              onCancel={() => {
                setShowOptions(false)
                setIsProcessing(false)
              }}
              isProcessing={isProcessing}
              fileType={currentFileType}
              progress={uploadProgress}
              progressMessage={progressMessage}
            />
          </div>
        </div>
      </div>
    )
  }

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="border-4 border-white/50 rounded-lg w-full max-w-md aspect-[3/4]" />
          </div>
          {flashSupported && (
            <div className="absolute top-6 right-6">
              <Button
                onClick={toggleFlash}
                size="lg"
                variant="outline"
                className={`h-12 w-12 rounded-full transition-all ${
                  flashEnabled 
                    ? 'bg-yellow-500 border-yellow-600 hover:bg-yellow-600' 
                    : 'bg-white/10 border-white/30 hover:bg-white/20'
                } text-white`}
              >
                {flashEnabled ? (
                  <Flashlight className="h-6 w-6" />
                ) : (
                  <FlashlightOff className="h-6 w-6" />
                )}
              </Button>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={stopCamera}
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={capturePhoto}
              size="lg"
              className="h-16 w-16 rounded-full bg-white hover:bg-white/90 text-black"
            >
              <Camera className="h-7 w-7" />
            </Button>
          </div>
          <p className="text-center text-white text-sm">
            Positionnez le document dans le cadre et appuyez pour scanner
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {isProcessing && (
        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/30">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-600 dark:text-blue-400">Génération en cours</p>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                  Veuillez patienter pendant la génération de votre contenu...
                </p>
              </div>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 text-center font-medium">{uploadProgress}%</p>
            {progressMessage && (
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 text-center font-medium">
                {progressMessage}
              </p>
            )}
          </div>
        </Card>
      )}

      <Card
        className={`border-2 border transition-all duration-300 ${
          isDragging ? "border-black bg-black/5 scale-[1.02]" : "border-border hover:border-black/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 sm:p-12 text-center space-y-4">
          {files.length === 0 ? (
            <>
              <div
                className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/5 flex items-center justify-center transition-all duration-300 ${isDragging ? "scale-110 bg-black/10" : ""}`}
              >
                <Upload
                  className={`h-6 w-6 sm:h-8 sm:w-8 text-white transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium text-white">Déposez vos documents et images ici</p>
                <p className="text-xs sm:text-sm text-white/80">ou</p>
                <p className="text-xs sm:text-sm text-white/80">Enregistrez ou importez en audio</p>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    className="cursor-pointer bg-transparent"
                    asChild
                    onClick={(e) => {
                      if (!user && !isCheckingAuth) {
                        e.preventDefault()
                        sessionStorage.setItem("returnAfterLogin", "upload-document")
                        router.push("/auth/login")
                      }
                    }}
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isCheckingAuth ? "Chargement..." : "Choisir des fichiers"}
                    </span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf,.jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={!user || isCheckingAuth}
                  />
                </label>
                <Button
                  variant="outline"
                  className="bg-transparent"
                  onClick={startCamera}
                  disabled={!user || isCheckingAuth}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scanner
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-base sm:text-lg font-medium">{files.length} fichier(s) sélectionné(s)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {files.map((uploadedFile) => (
                    <div key={uploadedFile.id} className="relative group">
                      <div className="border-2 border-border rounded-lg p-3 hover:border-black/50 transition-colors">
                        {uploadedFile.type === "image" && uploadedFile.preview ? (
                          <img
                            src={uploadedFile.preview || "/placeholder.svg"}
                            alt={uploadedFile.file.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="w-full h-24 bg-black/5 rounded flex items-center justify-center mb-2">
                            <FileText className="h-8 w-8 text-black/50" />
                          </div>
                        )}
                        <p className="text-xs truncate" title={uploadedFile.file.name}>
                          {uploadedFile.file.name}
                        </p>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(uploadedFile.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center pt-2">
                  <label htmlFor="file-upload-more">
                    <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                      <span>Ajouter plus</span>
                    </Button>
                    <input
                      id="file-upload-more"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.rtf,.jpg,.jpeg,.png,.webp"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <Button onClick={processFiles} disabled={isProcessing}>
                    {isProcessing ? "Traitement..." : "Continuer"}
                  </Button>
                  <Button variant="ghost" onClick={resetUploader}>
                    Annuler
                  </Button>
                </div>
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
