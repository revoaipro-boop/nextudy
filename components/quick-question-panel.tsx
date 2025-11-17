"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { X, Send, Loader2, Bot, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { QUICK_QUESTION_EVENTS } from "@/lib/quick-question-events"
import Image from "next/image"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function QuickQuestionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev)
    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)

    window.addEventListener(QUICK_QUESTION_EVENTS.TOGGLE, handleToggle)
    window.addEventListener(QUICK_QUESTION_EVENTS.OPEN, handleOpen)
    window.addEventListener(QUICK_QUESTION_EVENTS.CLOSE, handleClose)

    return () => {
      window.removeEventListener(QUICK_QUESTION_EVENTS.TOGGLE, handleToggle)
      window.removeEventListener(QUICK_QUESTION_EVENTS.OPEN, handleOpen)
      window.removeEventListener(QUICK_QUESTION_EVENTS.CLOSE, handleClose)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/quick-chat", {
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

        if (!response.ok) throw new Error("Failed to get response")

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
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          },
        ])
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

  const clearChat = () => {
    setMessages([])
  }

  return (
    <>
      {/* Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-gradient-to-r from-blue-100 to-purple-200 dark:from-blue-900 dark:to-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-500 dark:to-purple-600 rounded-xl p-2 shadow-lg relative h-9 w-9">
                      <Image
                        src="/images/quick-question-icon.png"
                        alt="Question rapide"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Question Rapide</h2>
                      <p className="text-xs text-muted-foreground">Sans contexte de matière</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearChat} className="w-full bg-transparent">
                    Effacer la conversation
                  </Button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence initial={false}>
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="relative h-12 w-12 mx-auto mb-3"
                      >
                        <Image
                          src="/images/quick-question-icon.png"
                          alt="Question rapide"
                          fill
                          className="object-contain"
                        />
                      </motion.div>
                      <p className="text-sm font-medium">Pose une question rapide !</p>
                      <p className="text-xs mt-1">Réponse directe sans contexte</p>
                    </motion.div>
                  )}

                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <div className="bg-blue-500/20 rounded-lg p-1.5 h-fit">
                          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}

                      <Card
                        className={cn(
                          "max-w-[70%] p-3 text-sm",
                          message.role === "user"
                            ? "bg-blue-600 dark:bg-blue-700 text-white"
                            : "bg-card border-blue-500/20",
                        )}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      </Card>

                      {message.role === "user" && (
                        <div className="bg-blue-500/20 rounded-lg p-1.5 h-fit">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 justify-start"
                    >
                      <div className="bg-blue-500/20 rounded-lg p-1.5 h-fit">
                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Card className="p-3 bg-card border-blue-500/20 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <Loader2 className="h-3 w-3" />
                          </motion.div>
                          <span>Réflexion...</span>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Question rapide..."
                    className="min-h-[50px] max-h-[120px] resize-none text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-[50px] w-[50px] shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
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
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
