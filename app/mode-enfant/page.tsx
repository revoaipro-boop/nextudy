"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Loader2, Baby, User, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
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
      const match = line.trim().match(/^(\d+)\.\s(.*)/)
      if (match) {
        elements.push(
          <div key={index} className="flex gap-2 my-1">
            <span className="font-semibold text-foreground/70">{match[1]}.</span>
            <span className="flex-1">{processInlineFormatting(match[2])}</span>
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

export default function ModeEnfantPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        setIsAuthenticated(true)
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const messageContent = input.trim()

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageContent,
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch("/api/mode-enfant-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (response.status === 401) {
          setError("Votre session a expiré. Veuillez vous reconnecter.")
          setIsLoading(false)
          setTimeout(() => {
            router.push("/auth/login")
          }, 2000)
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to get response")
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
                    setMessages((prev) => {
                      const newMessages = [...prev]
                      const lastMessage = newMessages[newMessages.length - 1]
                      if (lastMessage.role === "assistant") {
                        lastMessage.content += parsed.content
                      }
                      return newMessages
                    })
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
        setError("Une erreur s'est produite. Veuillez réessayer.")
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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-pink-500 rounded-xl p-2.5">
                <Baby className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Mode Enfant</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col px-4 sm:px-6 lg:px-8 py-4 max-w-6xl mx-auto">
        <Card className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <div className="flex items-center gap-3">
            <motion.div
              className="bg-pink-500 rounded-xl p-2.5"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Baby className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-lg text-pink-900">Mode Enfant Activé</p>
              <p className="text-sm text-pink-700">
                L'IA va parler comme un enfant de 5 ans pour t'aider à tout comprendre facilement !
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="mb-4 border-destructive/50 bg-destructive/5">
            <div className="p-4 flex items-start gap-3">
              <div>
                <p className="font-medium text-destructive">Erreur</p>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4 mb-4 pr-2">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-muted-foreground"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                >
                  <Baby className="h-16 w-16 mx-auto mb-4 opacity-50 text-pink-500" />
                </motion.div>
                <p className="text-xl font-medium mb-2">Pose ta première question !</p>
                <p className="text-sm text-muted-foreground">Je vais t'expliquer comme si j'avais 5 ans 😊</p>
              </motion.div>
            )}

            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <motion.div
                    className="bg-pink-100 rounded-xl p-2.5 h-fit"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Baby className="h-5 w-5 text-pink-600" />
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card
                    className={cn(
                      "p-4 max-w-3xl",
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border-border",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="leading-relaxed text-pretty">{preprocessMarkdown(message.content)}</div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-pretty">{message.content}</div>
                    )}
                  </Card>
                </motion.div>

                {message.role === "user" && (
                  <motion.div
                    className="bg-primary/20 rounded-xl p-2.5 h-fit"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <User className="h-5 w-5 text-primary" />
                  </motion.div>
                )}
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="bg-pink-100 rounded-xl p-2.5 h-fit">
                  <Baby className="h-5 w-5 text-pink-600" />
                </div>
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2 text-foreground/70">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.div>
                    <span>Je réfléchis...</span>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose une question..."
            className="min-h-[60px] max-h-[200px] resize-none transition-all duration-200 focus:ring-2 focus:ring-pink-500/50"
            disabled={isLoading}
          />

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px] shrink-0 bg-pink-500 hover:bg-pink-600"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="h-5 w-5" />
                </motion.div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
