"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, BookOpen, ImageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface TextSelectionMenuProps {
  selectedText: string
  position: { x: number; y: number }
  onClose: () => void
  onExplain: (text: string) => void
  onContext: (text: string) => void
  onIllustrate: (text: string) => void
}

export function TextSelectionMenu({
  selectedText,
  position,
  onClose,
  onExplain,
  onContext,
  onIllustrate,
}: TextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
        }}
      >
        <Card className="p-2 shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300"
              onClick={() => {
                onExplain(selectedText)
                onClose()
              }}
              title="Explication simplifiée"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              <span className="text-xs">Simplifier</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300"
              onClick={() => {
                onContext(selectedText)
                onClose()
              }}
              title="Contexte historique/scientifique"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="text-xs">Contexte</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-300"
              onClick={() => {
                onIllustrate(selectedText)
                onClose()
              }}
              title="Illustration graphique"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">Illustrer</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
