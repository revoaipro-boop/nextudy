"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  importance?: number
  due_date: string | null
  created_at: string
}

interface TaskCardProps {
  task: Task
  onToggleComplete: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const startXRef = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const getImportanceLevel = (importance: number): "low" | "medium" | "high" => {
    if (importance <= 3) return "low"
    if (importance <= 6) return "medium"
    return "high"
  }

  const getImportanceFromPriority = (priority: string): number => {
    if (priority === "high") return 9
    if (priority === "medium") return 5
    return 2
  }

  const importance = task.importance ?? getImportanceFromPriority(task.priority)
  const importanceLevel = getImportanceLevel(importance)

  const getImportanceColor = () => {
    if (importanceLevel === "low") return "bg-green-500"
    if (importanceLevel === "medium") return "bg-yellow-500"
    return "bg-red-500"
  }

  const getColorValue = () => {
    if (importanceLevel === "low") return "rgb(34, 197, 94)"
    if (importanceLevel === "medium") return "rgb(234, 179, 8)"
    return "rgb(239, 68, 68)"
  }

  const getImportanceLabel = () => {
    if (importanceLevel === "low") return "Faible"
    if (importanceLevel === "medium") return "Moyen"
    return "Important"
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (task.completed) return
    startXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || task.completed) return
    const currentX = e.touches[0].clientX
    const distance = currentX - startXRef.current
    // Only allow right swipe
    if (distance > 0) {
      setSwipeDistance(Math.min(distance, 150))
    }
  }

  const handleTouchEnd = async () => {
    if (!isDragging || task.completed) return
    setIsDragging(false)

    // If swiped more than 100px, complete the task
    if (swipeDistance > 100) {
      setIsCompleting(true)
      // Keep the swipe position for a moment
      await new Promise((resolve) => setTimeout(resolve, 200))
      onToggleComplete(task)
    } else {
      // Reset swipe
      setSwipeDistance(0)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (task.completed) return
    startXRef.current = e.clientX
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || task.completed) return
    const distance = e.clientX - startXRef.current
    if (distance > 0) {
      setSwipeDistance(Math.min(distance, 150))
    }
  }

  const handleMouseUp = async () => {
    if (!isDragging || task.completed) return
    setIsDragging(false)

    if (swipeDistance > 100) {
      setIsCompleting(true)
      await new Promise((resolve) => setTimeout(resolve, 200))
      onToggleComplete(task)
    } else {
      setSwipeDistance(0)
    }
  }

  const swipeProgress = Math.min(swipeDistance / 100, 1)

  return (
    <div
      ref={cardRef}
      className={`group relative flex items-center gap-3 p-4 bg-card rounded-xl transition-all select-none overflow-hidden ${
        task.completed ? "border-2 border-green-500" : isDragging ? "border-2" : "border-2 border-red-500"
      } ${isCompleting ? "animate-slide-down" : ""}`}
      style={{
        transform: task.completed ? undefined : `translateX(${swipeDistance}px)`,
        transition: isDragging || isCompleting ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        borderColor: task.completed
          ? undefined
          : isDragging || swipeProgress > 0
            ? `rgb(${Math.floor(239 - (239 - 34) * swipeProgress)}, ${Math.floor(68 + (197 - 68) * swipeProgress)}, ${Math.floor(68 + (94 - 68) * swipeProgress)})`
            : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging && !isCompleting) {
          setIsDragging(false)
          setSwipeDistance(0)
        }
      }}
    >
      {!task.completed && swipeProgress > 0 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-lg transition-all duration-75 flex items-center justify-center z-10"
          style={{
            left: `${Math.max(8, swipeDistance - 20)}px`,
            opacity: swipeProgress,
            scale: 0.8 + swipeProgress * 0.2,
            width: "40px",
            height: "40px",
            backgroundColor: `rgb(${Math.floor(255 - (255 - 255) * swipeProgress)}, ${Math.floor(255 - (255 - 255) * swipeProgress)}, ${Math.floor(255 - (255 - 255) * swipeProgress)})`,
            border: `3px solid rgb(${Math.floor(239 - (239 - 34) * swipeProgress)}, ${Math.floor(68 + (197 - 68) * swipeProgress)}, ${Math.floor(68 + (94 - 68) * swipeProgress)})`,
          }}
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke={`rgb(${Math.floor(239 - (239 - 34) * swipeProgress)}, ${Math.floor(68 + (197 - 68) * swipeProgress)}, ${Math.floor(68 + (94 - 68) * swipeProgress)})`}
            strokeWidth="3"
            style={{ opacity: swipeProgress }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Completion circle indicator */}
      {!task.completed ? (
        <div className="flex-shrink-0 flex items-center gap-1 text-muted-foreground">
          <ChevronRight className="h-5 w-5" />
          <ChevronRight className="h-5 w-5 -ml-3" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 border-4 border-green-500 flex items-center justify-center">
          <svg
            className="w-full h-full text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Task content */}
      <div className="flex-1 min-w-0 relative z-0">
        <p
          className={`text-base font-medium break-words transition-all duration-75 ${
            task.completed
              ? "text-green-700 dark:text-green-400 line-through"
              : swipeProgress > 0.5
                ? "text-green-600 dark:text-green-400"
                : "text-foreground"
          }`}
          style={{
            color:
              !task.completed && swipeProgress > 0
                ? `rgb(${Math.floor(0 + (34 - 0) * swipeProgress)}, ${Math.floor(0 + (197 - 0) * swipeProgress)}, ${Math.floor(0 + (94 - 0) * swipeProgress)})`
                : undefined,
          }}
        >
          {task.title}
        </p>
        {!task.completed && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Importance: {getImportanceLabel()} {isDragging && swipeProgress > 0 && "• Glissez pour compléter →"}
          </p>
        )}
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
        className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
