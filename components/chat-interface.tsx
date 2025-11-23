"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, RefreshCw, ImageIcon, FileText, Mic, Square, Plus, ArrowLeft, X } from 'lucide-react'
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { useTheme } from "@/components/theme-provider"
import { extractPDFText } from "@/lib/pdf-extractor"
import { generateShortId } from "@/lib/conversations"

interface ChatInterfaceProps {
  subject: string
  grade: string
  format: "normal" | "kid" | "correction"
  conversationId?: string
  initialMessages?: Message[]
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  images?: string[]
  displayContent?: string
  timestamp?: number
}

export function ChatInterface({ subject, grade, format, conversationId, initialMessages = [] }: ChatInterfaceProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; type: string }>>([])
  const [isUploading, setIsUploading] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { theme } = useTheme()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newFiles: Array<{ name: string; url: string; type: string }> = []

    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          newFiles.push({ name: file.name, url: base64, type: "image" })
        } else if (file.type === "application/pdf") {
          const text = await extractPDFText(file)
          newFiles.push({ name: file.name, url: text, type: "document" })
        } else if (file.type.startsWith("text/")) {
          const text = await file.text()
          newFiles.push({ name: file.name, url: text, type: "document" })
        }
      } catch (error) {
        console.error("[v0] Error uploading file:", error)
        alert("Erreur lors du traitement du fichier: " + file.name)
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles])
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || uploadedFiles.length > 0) && !isLoading) {
      const messageContent = input.trim()
      const messageImages = uploadedFiles.filter((f) => f.type === "image").map((f) => f.url)
      const messageDocuments = uploadedFiles.filter((f) => f.type === "document")

      let displayContent = messageContent
      let fullContent = messageContent

      if (messageDocuments.length > 0) {
        displayContent += "\n\n[Documents importés]:\n"
        messageDocuments.forEach((doc) => {
          displayContent += `📄 ${doc.name}\n`
        })

        fullContent += "\n\n[Documents joints pour analyse]:\n"
        messageDocuments.forEach((doc) => {
          fullContent += `\n--- Début du document: ${doc.name} ---\n`
          fullContent += doc.url
          fullContent += `\n--- Fin du document: ${doc.name} ---\n`
        })
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: fullContent,
        displayContent: displayContent,
        images: messageImages,
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setUploadedFiles([])
      setIsLoading(true)

      if (!currentConversationId) {
        const shortId = generateShortId()
        setCurrentConversationId(shortId)
        window.history.pushState(null, "", `/chat-ia/c/${shortId}`)

        // Create conversation in database
        try {
          await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shortId,
              title: messageContent.substring(0, 50),
              subject,
              grade,
              format,
              messages: [{
                role: "user",
                content: fullContent,
                timestamp: Date.now()
              }]
            }),
          })
        } catch (error) {
          console.error("[v0] Error creating conversation:", error)
        }
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Subject": subject,
            "X-Grade": grade,
            "X-Format": format,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
              images: m.images,
              timestamp: m.timestamp
            })),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get response")
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        }

        setMessages((prev) => [...prev, assistantMessage])

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

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
                    for (let i = 0; i < parsed.content.length; i++) {
                      await new Promise((resolve) => setTimeout(resolve, 5))
                      setMessages((prev) => {
                        const newMessages = [...prev]
                        const lastMessage = newMessages[newMessages.length - 1]
                        if (lastMessage.role === "assistant") {
                          lastMessage.content += parsed.content[i]
                        }
                        return newMessages
                      })
                    }
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error sending message:", error)
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((track) => track.stop())
        await transcribeAudio(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("[v0] Error starting recording:", err)
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to transcribe audio")

      const data = await response.json()
      if (data.text) {
        setInput(data.text)
      }
    } catch (error) {
      console.error("[v0] Error transcribing audio:", error)
      alert("Erreur lors de la transcription audio")
    }
  }

  const handleActualReset = () => {
    setMessages([])
    setInput("")
    setUploadedFiles([])
    setCurrentConversationId(undefined)
    router.push("/chat-ia")
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-300 hover:text-white hover:bg-gray-900"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-white text-sm font-medium">ChatIA</button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-300 hover:text-white hover:bg-gray-900"
            onClick={handleActualReset}
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-black">
        <div className="max-w-3xl mx-auto px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <h1 className="text-3xl text-white mb-8">Demandez-moi tout ce que vous voulez</h1>
            </div>
          ) : (
            <div className="py-8 space-y-10">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <div
                    className={`text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide ${message.role === "user" ? "text-right" : ""}`}
                  >
                    {message.role === "user" ? "Vous" : "ChatIA"}
                  </div>

                  <div className={`text-[15px] leading-relaxed ${message.role === "user" ? "text-right" : ""}`}>
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-100 whitespace-pre-wrap leading-7">
                          {message.displayContent || message.content}
                        </p>
                        {message.images && message.images.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            {message.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img || "/placeholder.svg"}
                                alt={`Uploaded ${idx + 1}`}
                                className="rounded-lg max-h-48 object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group">
                  <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">ChatIA</div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">ChatIA réfléchit...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800 bg-black">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
                >
                  {file.type === "image" ? (
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-300 truncate max-w-[150px]">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="rounded p-1 hover:bg-gray-700">
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-full px-4 py-3 max-w-3xl mx-auto border border-gray-700">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading || isRecording}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <Plus className="h-5 w-5" />
              </button>

              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 resize-none min-h-[24px] max-h-[200px] focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-6"
                disabled={isLoading || isRecording}
                rows={1}
              />

              <button
                type="button"
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                disabled={isLoading}
                className={`flex-shrink-0 transition-colors ${
                  isRecording ? "text-red-500 hover:bg-red-500/10 animate-pulse" : "text-gray-400 hover:text-white"
                }`}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                type="submit"
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || isRecording}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 text-center mt-3">
            ChatIA peut commettre des erreurs. Il est recommandé de vérifier les informations importantes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
