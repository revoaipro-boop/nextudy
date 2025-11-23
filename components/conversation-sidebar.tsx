"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PanelLeftClose, PanelLeft, Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/conversations"
import { listConversations, deleteConversation } from "@/lib/conversations"

interface ConversationSidebarProps {
  currentConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  subject: string
  grade: string
  format: string
  isOpen?: boolean // Added optional prop from parent
  onToggle?: () => void // Added optional prop from parent
}

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  subject,
  grade,
  format,
  isOpen: externalIsOpen, // Renamed to avoid conflict
  onToggle: externalOnToggle, // Renamed to avoid conflict
}: ConversationSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnToggle || setInternalIsOpen
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const allConversations = await listConversations()
      // Filter by current subject/grade/format
      const filtered = allConversations.filter(
        (c) => c.subject === subject && c.grade === grade && c.format === format
      )
      setConversations(filtered)
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [subject, grade, format])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("Supprimer cette conversation ?")) {
      return
    }

    setDeletingId(id)
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      
      // If deleting current conversation, create new one
      if (id === currentConversationId) {
        onNewConversation()
      }
    } catch (error) {
      console.error("[v0] Error deleting conversation:", error)
      alert("Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Toggle button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-4 top-20 z-50"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={() => typeof setIsOpen === 'function' ? setIsOpen(true) : setIsOpen(true)} // Handle both function types
              className="h-10 w-10 rounded-full shadow-lg bg-background"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => typeof setIsOpen === 'function' ? setIsOpen(false) : setIsOpen(false)} // Handle both function types
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Historique
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => typeof setIsOpen === 'function' ? setIsOpen(false) : setIsOpen(false)} // Handle both function types
                  className="h-8 w-8"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              {/* New conversation button */}
              <div className="p-3 border-b border-border">
                <Button
                  onClick={onNewConversation}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle conversation
                </Button>
              </div>

              {/* Conversations list */}
              <ScrollArea className="flex-1 p-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Aucune conversation
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <motion.button
                        key={conversation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onSelectConversation(conversation.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors group relative",
                          "hover:bg-accent",
                          currentConversationId === conversation.id
                            ? "bg-accent border-2 border-primary"
                            : "border border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate mb-1">
                              {conversation.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(conversation.updatedAt)} • {conversation.messages.length} messages
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(conversation.id, e)}
                            disabled={deletingId === conversation.id}
                          >
                            {deletingId === conversation.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
