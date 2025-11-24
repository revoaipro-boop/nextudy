"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Loader2, Mic, MicOff, Upload, AlertCircle, ExternalLink, Sparkles, FileText, Copy, Check, Brain, Baby, Target, X, Share2 } from 'lucide-react'
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TextSelectionMenu } from "@/components/text-selection-menu" // Added TextSelectionMenu
import { Input } from "@/components/ui/input" // Added Input
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { createConversation, loadConversation, updateConversation, generateConversationTitle } from "@/lib/conversations"
import { useRouter } from 'next/navigation' // Import useRouter

interface ChatInterfaceProps {
  subject: string
  grade: string
  format: "normal" | "kid" | "correction"
  conversationId?: string
  initialMessages?: Message[] // Added initialMessages
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ name: string; url: string; logo: string }>
  images?: string[]
}

interface UploadedFile {
  id: string
  name: string
  dataUrl: string
  type: "image" | "document"
}

interface GeneratedContent {
  type: "qcm" | "fiche" | "flashcards"
  content: string
  timestamp: number
}

function shouldShowSourcesPopup(userMessage: string): boolean {
  const lowerMessage = userMessage.toLowerCase()
  const hideSourcesKeywords = ["calcule", "résous", "exercice", "corrige"]
  if (hideSourcesKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return false
  }
  return true
}

function preprocessMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={index} className="text-xl font-bold mt-4 mb-2">
          {line.slice(2)}
        </h2>,
      )
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="text-lg font-semibold mt-3 mb-2">
          {line.slice(3)}
        </h3>,
      )
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const content = line.trim().slice(2)
      elements.push(
        <div key={index} className="flex gap-2 my-1">
          <span className="text-foreground/70 mt-1">•</span>
          <span className="flex-1">{processInlineFormatting(content)}</span>
        </div>,
      )
    } else if (/^\d+\.\s/.test(line.trim())) {
      const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/)
      if (numberedMatch) {
        elements.push(
          <div key={index} className="flex gap-2 my-1">
            <span className="font-semibold text-foreground/70">{numberedMatch[1]}.</span>
            <span className="flex-1">{processInlineFormatting(numberedMatch[2])}</span>
          </div>,
        )
      }
    } else if (line.trim() === "") {
      elements.push(<div key={index} className="h-2" />)
    } else {
      elements.push(
        <p key={index} className="my-2">
          {processInlineFormatting(line)}
        </p>,
      )
    }
  })

  return <div className="space-y-1">{elements}</div>
}

function processInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let currentIndex = 0
  let partKey = 0

  const boldRegex = /(\*\*|__)(.*?)\1/g
  let match

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(<span key={partKey++}>{text.slice(currentIndex, match.index)}</span>)
    }

    parts.push(
      <strong key={partKey++} className="font-bold text-foreground">
        {match[2]}
      </strong>,
    )

    currentIndex = match.index + match[0].length
  }

  if (currentIndex < text.length) {
    parts.push(<span key={partKey++}>{text.slice(currentIndex)}</span>)
  }

  return parts.length > 0 ? parts : text
}

const formatConfig = {
  normal: {
    name: "Mode Normal",
    icon: Brain,
    description: "Explications claires et détaillées adaptées à votre niveau",
    color: "from-blue-500 to-cyan-500",
  },
  kid: {
    name: "Mode Enfant",
    icon: Baby,
    description: "Explications simples et ludiques avec des exemples amusants",
    color: "from-pink-500 to-purple-500",
  },
  correction: {
    name: "Mode Concentration",
    icon: Target,
    description: "Réponses concises et directes pour réviser efficacement",
    color: "from-orange-500 to-red-500",
  },
}

export function ChatInterface({ subject, grade, format, conversationId: initialConversationId, initialMessages = [] }: ChatInterfaceProps) { // Destructure initialMessages
  const router = useRouter() // Initialize useRouter
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(initialMessages) // Use initialMessages
  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showSubjectBar, setShowSubjectBar] = useState(true)
  const [error, setError] = useState<string>("")
  const [showSourcesDialog, setShowSourcesDialog] = useState(false)
  const [currentSources, setCurrentSources] = useState<Array<{ name: string; url: string; logo: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollTopRef = useRef(0)

  const [generateQCM, setGenerateQCM] = useState(false)
  const [generateFiche, setGenerateFiche] = useState(false)
  const [generateFlashcards, setGenerateFlashcards] = useState(false)
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)

  const [selectedText, setSelectedText] = useState("")
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const [showSelectionMenu, setShowSelectionMenu] = useState(false)
  const [contextualResponse, setContextualResponse] = useState<string | null>(null)
  const [isLoadingContextual, setIsLoadingContextual] = useState(false)

  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [shareTitle, setShareTitle] = useState("")

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId || null) // Use initialConversationId
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const currentFormat = formatConfig[format]
  const FormatIcon = currentFormat.icon

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
        setAudioLevel(0)
        setIsSpeaking(false)

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Transcription failed")

      const { text } = await response.json()
      setInput(text)
    } catch (error) {
      console.error("[v0] Transcription error:", error)
      alert("Erreur lors de la transcription. Veuillez réessayer.")
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const allowedTypes = ["application/pdf", "text/plain", "image/jpeg", "image/png", "image/jpg", "image/webp"]

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: Type de fichier non accepté. Seuls PDF, TXT et images sont acceptés.`)
        continue
      }

      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setUploadedFiles((prev) => [
            ...prev,
            {
              id: Date.now().toString() + Math.random(),
              name: file.name,
              dataUrl,
              type: "image",
            },
          ])
        }
        reader.readAsDataURL(file)
      } else {
        setIsLoading(true)

        try {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("subject", subject)
          formData.append("grade", grade)

          const response = await fetch("/api/process-file", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) throw new Error("File processing failed")

          const { content } = await response.json()

          const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: `[Fichier importé: ${file.name}]\n\nVoici le contenu structuré que tu dois m'aider à comprendre et réviser.`,
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: content,
          }

          setMessages((prev) => [...prev, userMessage, assistantMessage])
        } catch (error) {
          console.error("[v0] File processing error:", error)
          alert(`Erreur lors du traitement de ${file.name}. Veuillez réessayer.`)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || uploadedFiles.length > 0) && !isLoading) {
      const messageContent = input.trim()

      const imageUrls = uploadedFiles.filter((f) => f.type === "image").map((f) => f.dataUrl)

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageContent || "Analyse ces images",
        images: imageUrls.length > 0 ? imageUrls : undefined,
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      const filesToSend = [...uploadedFiles]
      setUploadedFiles([])
      setIsLoading(true)
      setError("")

      let conversationId = currentConversationId
      
      if (!conversationId) {
        setIsCreatingConversation(true)
        try {
          conversationId = await createConversation(subject, grade, format, userMessage)
          setCurrentConversationId(conversationId)
          
          router.push(`/chat-ia/c/${conversationId}`)
          console.log("[v0] Created conversation and updated URL:", conversationId)
        } catch (error) {
          console.error("[v0] Error creating conversation:", error)
          setError("Erreur lors de la création de la conversation. Veuillez réessayer.")
          setIsLoading(false)
          setIsCreatingConversation(false)
          return
        } finally {
          setIsCreatingConversation(false)
        }
      }

      const showPopup = shouldShowSourcesPopup(messageContent)

      const requestedQCM = generateQCM
      const requestedFiche = generateFiche
      const requestedFlashcards = generateFlashcards

      const controller = new AbortController()
      setAbortController(controller)

      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])

      try {
        console.log("[v0] Starting async message generation...")
        
        // Create async generation task
        const response = await fetch("/api/chat/async-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageId: assistantMessageId,
            conversationId: conversationId, // Use the conversationId we just created or loaded
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
              ...(m.images && { images: m.images }),
            })),
            subject,
            grade,
            format,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to start generation")
        }

        const { taskId } = await response.json()
        console.log("[v0] Generation task created:", taskId)

        // Start polling for updates
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await fetch(`/api/chat/message/${assistantMessageId}`)
            
            if (!pollResponse.ok) {
              throw new Error("Failed to poll message")
            }

            const data = await pollResponse.json()
            
            // Update message content
            setMessages((prev) => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]
              if (lastMessage.id === assistantMessageId) {
                lastMessage.content = data.content || ""
                lastMessage.sources = data.sources || undefined // Update sources as well
              }
              return newMessages
            })

            // Check if generation is complete
            if (data.status === "completed") {
              console.log("[v0] Generation completed")
              clearInterval(pollInterval)
              setIsLoading(false)
              setAbortController(null) // Clear abort controller on completion
              
              // Show sources dialog if applicable
              if (showPopup && data.sources && data.sources.length > 0) {
                setCurrentSources(data.sources);
                setShowSourcesDialog(true);
                setTimeout(() => setShowSourcesDialog(false), 2000); // Auto-close after 2 seconds
              }

              // Add generated content to sidebar if requested
              const timestamp = Date.now()
              if (requestedQCM && data.qcmContent) {
                setGeneratedContents((prev) => [...prev, { type: "qcm", content: data.qcmContent, timestamp }])
              }
              if (requestedFiche && data.ficheContent) {
                setGeneratedContents((prev) => [...prev, { type: "fiche", content: data.ficheContent, timestamp: timestamp + 1 }])
              }
              if (requestedFlashcards && data.flashcardsContent) {
                setGeneratedContents((prev) => [
                  ...prev,
                  { type: "flashcards", content: data.flashcardsContent, timestamp: timestamp + 2 },
                ])
              }
              
              // Save to conversation
              if (conversationId) { // Use the determined conversationId
                const messagesToSave = [
                  {
                    id: userMessage.id,
                    role: userMessage.role as "user" | "assistant",
                    content: userMessage.content,
                    timestamp: Date.now(),
                  },
                  {
                    id: assistantMessageId,
                    role: "assistant" as "user" | "assistant",
                    content: data.content,
                    sources: data.sources,
                    timestamp: Date.now(),
                  },
                ]
                
                updateConversation(conversationId, messagesToSave).catch(console.error)
              }
            } else if (data.status === "failed") {
              console.error("[v0] Generation failed:", data.error)
              clearInterval(pollInterval)
              setIsLoading(false)
              setError(data.error || "La génération a échoué")
            }
          } catch (pollError) {
            console.error("[v0] Polling error:", pollError)
            // Don't stop polling on temporary errors
          }
        }, 200) // Poll every 200ms

        // Cleanup on unmount or when user navigates away
        return () => {
          clearInterval(pollInterval)
        }

      } catch (error: any) {
        console.error("[v0] Error starting async generation:", error)
        setMessages((prev) => prev.slice(0, -1)) // Remove the pending assistant message
        setError("Une erreur s'est produite. Veuillez réessayer.")
        setIsLoading(false)
        setAbortController(null)
      } finally {
        setGenerateQCM(false)
        setGenerateFiche(false)
        setGenerateFlashcards(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy:", error)
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 3) {
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      if (rect) {
        setSelectedText(text)
        setSelectionPosition({
          x: rect.left + rect.width / 2 - 150, // Adjust position for menu width
          y: rect.top - 60, // Adjust position for menu height
        })
        setShowSelectionMenu(true)
      }
    } else {
      setShowSelectionMenu(false)
    }
  }

  const handleExplain = async (text: string) => {
    setIsLoadingContextual(true)
    setContextualResponse(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Subject": subject,
          "X-Grade": grade,
          "X-Format": "kid", // Use 'kid' format for explanations
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Explique-moi de manière simple et claire ce concept : "${text}"`,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error("Failed to get explanation")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim() !== "")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullResponse += parsed.content
                  setContextualResponse(fullResponse)
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error getting explanation:", error)
      alert("Erreur lors de la récupération de l'explication.")
    } finally {
      setIsLoadingContextual(false)
    }
  }

  const handleContext = async (text: string) => {
    setIsLoadingContextual(true)
    setContextualResponse(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Subject": subject,
          "X-Grade": grade,
          "X-Format": "normal",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Donne-moi le contexte historique et scientifique de : "${text}"`,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error("Failed to get context")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim() !== "")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullResponse += parsed.content
                  setContextualResponse(fullResponse)
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error getting context:", error)
      alert("Erreur lors de la récupération du contexte.")
    } finally {
      setIsLoadingContextual(false)
    }
  }

  const handleIllustrate = async (text: string) => {
    setIsLoadingContextual(true)
    setContextualResponse(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Subject": subject,
          "X-Grade": grade,
          "X-Format": "normal",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Crée une description détaillée d'un schéma ou diagramme pour illustrer : "${text}". Utilise des emojis et des symboles pour rendre le schéma visuel et facile à comprendre.`,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error("Failed to get illustration")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim() !== "")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullResponse += parsed.content
                  setContextualResponse(fullResponse)
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error getting illustration:", error)
      alert("Erreur lors de la génération de l'illustration.")
    } finally {
      setIsLoadingContextual(false)
    }
  }

  const handleShareChat = async () => {
    if (messages.length === 0) {
      alert("Aucune conversation à partager")
      return
    }

    setIsGeneratingLink(true)

    try {
      const response = await fetch("/api/share-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: shareTitle || `${subject} - ${format}`,
          subject,
          grade,
          format,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            sources: m.sources,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to create share link")

      const { shareToken } = await response.json()
      const link = `${window.location.origin}/shared/${shareToken}`
      setShareLink(link)
    } catch (error) {
      console.error("[v0] Error sharing chat:", error)
      alert("Erreur lors de la création du lien de partage")
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      alert("Lien copié !")
    } catch (error) {
      console.error("[v0] Failed to copy link:", error)
    }
  }

  useEffect(() => {
    const loadConversationFromUrl = async () => {
      // This logic is now handled by ConversationSidebar for initial load
      // and by handleSelectConversation for subsequent loads.
      // The initialMessages prop is used to pre-populate the chat if provided.
    }

    loadConversationFromUrl()
  }, [initialConversationId]) // Dependency on initialConversationId might be useful for re-loading if it changes

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const conversation = await loadConversation(conversationId)
      if (conversation) {
        setCurrentConversationId(conversation.id)
        setMessages(conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
        })))
        setGeneratedContents([])
        
        router.push(`/chat-ia/c/${conversationId}?subject=${encodeURIComponent(conversation.subject)}&grade=${encodeURIComponent(conversation.grade)}&format=${conversation.format}`)
        
        setIsSidebarOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error loading conversation:", error)
      setError("Erreur lors du chargement de la conversation.")
    }
  }

  const handleNewConversation = () => {
    setCurrentConversationId(null)
    setMessages([])
    setGeneratedContents([])
    
    router.push(`/chat-ia?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}&format=${format}`)
    
    setIsSidebarOpen(false)
  }

  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkIncompleteGenerations = async () => {
      if (messages.length === 0) return
      
      // Find the last assistant message
      const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant")
      
      if (!lastAssistantMessage) return
      
      try {
        const response = await fetch(`/api/chat/message/${lastAssistantMessage.id}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // If generation is still in progress, resume polling
          if (data.status === "generating") {
            console.log("[v0] Resuming generation polling for message:", lastAssistantMessage.id)
            setIsLoading(true)
            
            const pollInterval = setInterval(async () => {
              try {
                const pollResponse = await fetch(`/api/chat/message/${lastAssistantMessage.id}`)
                
                if (!pollResponse.ok) {
                  throw new Error("Failed to poll message")
                }

                const pollData = await pollResponse.json()
                
                setMessages((prev) => {
                  const newMessages = [...prev]
                  const msgIndex = newMessages.findIndex((m) => m.id === lastAssistantMessage.id)
                  if (msgIndex !== -1) {
                    newMessages[msgIndex].content = pollData.content || ""
                    newMessages[msgIndex].sources = pollData.sources || undefined
                  }
                  return newMessages
                })

                if (pollData.status === "completed" || pollData.status === "failed") {
                  console.log("[v0] Resumed generation completed")
                  clearInterval(pollInterval)
                  setIsLoading(false)
                  setAbortController(null) // Clear abort controller on completion
                  
                  // Handle completion or failure scenarios
                  if (pollData.status === "completed") {
                    // Potentially update sidebar content here if needed based on pollData
                  } else {
                    setError(pollData.error || "La génération a échoué")
                  }
                }
              } catch (pollError) {
                console.error("[v0] Polling error:", pollError)
                // Don't stop polling on temporary errors
              }
            }, 200)
          }
        }
      } catch (error) {
        console.error("[v0] Error checking incomplete generations:", error)
      }
    }
    
    checkIncompleteGenerations()
  }, []) // Only on mount

  // Original useEffect for chat history loading - kept for reference, now handled by ConversationSidebar
  // useEffect(() => {
  //   const loadChatHistory = async () => {
  //     try {
  //       console.log("[v0] Loading chat history for:", { subject, grade, format })
  //       const response = await fetch("/api/chat-history")
        
  //       if (response.ok) {
  //         const { history } = await response.json()
          
  //         const matchingConversation = history.find(
  //           (h: any) => h.subject === subject && h.grade === grade && h.format === format
  //         )
          
  //         if (matchingConversation && matchingConversation.messages) {
  //           console.log("[v0] Loaded previous chat history:", matchingConversation.messages.length, "messages")
  //           setMessages(
  //             matchingConversation.messages.map((m: any, idx: number) => ({
  //               id: `${Date.now()}-${idx}`,
  //               role: m.role,
  //               content: m.content,
  //               sources: m.sources,
  //             }))
  //           )
  //         } else {
  //           console.log("[v0] No matching chat history found")
  //         }
  //       } else {
  //         console.error("[v0] Failed to load chat history, status:", response.status)
  //       }
  //     } catch (error) {
  //       console.error("[v0] Error loading chat history:", error)
  //     } finally {
  //       setIsLoadingHistory(false)
  //     }
  //   }

  //   // loadChatHistory() // This is now handled by ConversationSidebar
  // }, [subject, grade, format])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[v0] Tab hidden, streaming continues in background')
      } else {
        console.log('[v0] Tab visible again')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])


  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Chargement de la conversation...</p>
      </div>
    )
  }

  return (
    <>
      <ConversationSidebar
        currentConversationId={currentConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        subject={subject}
        grade={grade}
        format={format}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-col lg:flex-row h-full w-full">
        {/* Left panel: Discussion (2/3) */}
        <div className="flex-1 lg:w-2/3 flex flex-col border-r border-border">
          {/* Format info banner */}
          <div className="border-b border-border bg-background/95 backdrop-blur-sm z-40 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </Button>
            </div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border-2 bg-gradient-to-r ${currentFormat.color} p-[2px]`}>
                <div className="bg-background rounded-[calc(var(--radius)-2px)] p-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${currentFormat.color}`}>
                      <FormatIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{currentFormat.name}</h3>
                      <p className="text-xs text-muted-foreground">{currentFormat.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Processing steps dialog */}
          <Dialog open={showSourcesDialog} onOpenChange={setShowSourcesDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Nextudy réfléchit...
                </DialogTitle>
                <DialogDescription>Sources consultées pour votre réponse</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {currentSources.map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-2xl">{source.logo}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {error && (
            <Card className="m-4 border-destructive/50 bg-destructive/5">
              <div className="p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive text-sm">Erreur</p>
                  <p className="text-xs text-destructive/90">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Main chat area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 pb-32">
            <div className="space-y-4 mb-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card
                    className={`max-w-[70%] sm:max-w-[65%] ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border-border"
                    }`}
                  >
                    <div className="p-3">
                      {message.images && message.images.length > 0 && (
                        <div className="mb-3 flex gap-2 flex-wrap">
                          {message.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img || "/placeholder.svg"}
                              alt={`Uploaded ${idx + 1}`}
                              className="max-w-[200px] rounded-lg border border-border"
                            />
                          ))}
                        </div>
                      )}
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        onMouseUp={message.role === "assistant" ? handleTextSelection : undefined}
                      >
                        {preprocessMarkdown(message.content)}
                      </div>
                      {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Sources consultées:</p>
                          <div className="space-y-1.5">
                            {message.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs hover:underline text-muted-foreground hover:text-foreground transition-colors group"
                              >
                                <span className="text-base">{source.logo}</span>
                                <span className="flex-1 truncate">{source.name}</span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {message.role === "assistant" && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedMessageId === message.id ? (
                              <>
                                <Check className="h-3 w-3 mr-1 text-green-500" />
                                Copié
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copier
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area at bottom of left panel */}
          <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
            {uploadedFiles.length > 0 && (
              <div className="mb-2">
                <div className="flex gap-2 flex-wrap">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative group bg-card border border-border rounded-lg p-1 hover:border-primary transition-colors"
                    >
                      {file.type === "image" ? (
                        <img
                          src={file.dataUrl || "/placeholder.svg"}
                          alt={file.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-16 flex items-center justify-center bg-accent rounded">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,image/jpeg,image/png,image/jpg,image/webp"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-[44px] w-[44px] shrink-0 bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isCreatingConversation}
                title="Déposer documents ET images"
              >
                <Upload className="h-4 w-4" />
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Pose une question sur ${subject}...`}
                className="min-h-[44px] max-h-[150px] resize-none text-sm"
                disabled={isLoading || isTranscribing || isCreatingConversation}
              />

              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className="h-[44px] w-[44px] shrink-0 relative overflow-hidden"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing || isCreatingConversation}
              >
                {isTranscribing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-4 w-4 animate-spin mb-1" />
                    <span className="text-[8px]">Transcription...</span>
                  </div>
                ) : isRecording ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => {
                        // Calculate height based on audio level and bar position
                        const baseHeight = 8
                        const maxHeight = 24
                        const voiceMultiplier = isSpeaking ? (audioLevel / 255) * 2 : 0
                        const barHeight = Math.min(baseHeight + voiceMultiplier * (maxHeight - baseHeight), maxHeight)
                        
                        return (
                          <motion.div
                            key={i}
                            className="w-1 bg-white rounded-full"
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
                    <MicOff className="h-4 w-4 relative z-10 opacity-0" />
                  </>
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-[44px] w-[44px] shrink-0"
                  onClick={handleStopResponse}
                  title="Arrêter la réponse"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="h-[44px] w-[44px] shrink-0"
                  disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || isCreatingConversation}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              )}

              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-[44px] w-[44px] shrink-0 bg-transparent"
                onClick={() => setShowShareDialog(true)}
                disabled={messages.length === 0 || isCreatingConversation}
                title="Partager la conversation"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right panel: Content Generation (1/3) */}
        <div className="hidden lg:flex lg:w-1/3 flex-col bg-accent/20">
          <div className="border-b border-border p-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Générer du contenu
            </h3>
          </div>

          <div className="p-4 space-y-3 border-b border-border">
            <div className="flex items-center space-x-2">
              <Checkbox id="qcm" checked={generateQCM} onCheckedChange={(checked) => setGenerateQCM(!!checked)} />
              <Label htmlFor="qcm" className="text-sm cursor-pointer flex items-center gap-1.5">
                🧩 QCM
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="fiche" checked={generateFiche} onCheckedChange={(checked) => setGenerateFiche(!!checked)} />
              <Label htmlFor="fiche" className="text-sm cursor-pointer flex items-center gap-1.5">
                📄 Fiche
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flashcards"
                checked={generateFlashcards}
                onCheckedChange={(checked) => setGenerateFlashcards(!!checked)}
              />
              <Label htmlFor="flashcards" className="text-sm cursor-pointer flex items-center gap-1.5">
                🃏 Flashcards
              </Label>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {generatedContents.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                  <Check className="h-4 w-4 text-green-500" />
                  Contenu généré ({generatedContents.length})
                </h4>
                {generatedContents.map((item) => (
                  <Card key={item.timestamp} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {item.type === "qcm" && "🧩 QCM"}
                        {item.type === "fiche" && "📄 Fiche"}
                        {item.type === "flashcards" && "🃏 Flashcards"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(item.content, item.timestamp.toString())}
                        >
                          {copiedMessageId === item.timestamp.toString() ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            setGeneratedContents((prev) => prev.filter((c) => c.timestamp !== item.timestamp))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto">
                      {preprocessMarkdown(item.content)}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Sélectionne les options ci-dessus et pose une question pour générer du contenu
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Mobile action button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-blue-500"
          onClick={() => setShowActionPanel(true)}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile action dialog */}
      <Dialog open={showActionPanel} onOpenChange={setShowActionPanel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Générer du contenu
            </DialogTitle>
            <DialogDescription>Sélectionne ce que tu veux générer à partir de la conversation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="qcm-mobile"
                checked={generateQCM}
                onCheckedChange={(checked) => setGenerateQCM(!!checked)}
              />
              <Label htmlFor="qcm-mobile" className="text-sm cursor-pointer flex items-center gap-2">
                🧩 Générer un QCM
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="fiche-mobile"
                checked={generateFiche}
                onCheckedChange={(checked) => setGenerateFiche(!!checked)}
              />
              <Label htmlFor="fiche-mobile" className="text-sm cursor-pointer flex items-center gap-2">
                📄 Générer une fiche de révision
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="flashcards-mobile"
                checked={generateFlashcards}
                onCheckedChange={(checked) => setGenerateFlashcards(!!checked)}
              />
              <Label htmlFor="flashcards-mobile" className="text-sm cursor-pointer flex items-center gap-2">
                🃏 Générer des flashcards
              </Label>
            </div>
          </div>
          <Button onClick={() => setShowActionPanel(false)} className="w-full">
            Valider
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={contextualResponse !== null || isLoadingContextual}
        onOpenChange={() => setContextualResponse(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Explication contextuelle</DialogTitle>
            <DialogDescription>À propos de : "{selectedText}"</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoadingContextual ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {contextualResponse && preprocessMarkdown(contextualResponse)}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Partager la conversation
            </DialogTitle>
            <DialogDescription>
              Créez un lien pour partager cette conversation ChatIA avec d'autres personnes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-title">Titre (optionnel)</Label>
              <Input
                id="share-title"
                placeholder={`${subject} - ${format}`}
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
              />
            </div>

            {shareLink ? (
              <div className="space-y-2">
                <Label>Lien de partage</Label>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Button size="icon" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce lien est public et peut être partagé avec n'importe qui
                </p>
              </div>
            ) : (
              <Button onClick={handleShareChat} disabled={isGeneratingLink} className="w-full">
                {isGeneratingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération du lien...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Créer le lien de partage
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ChatInterface
