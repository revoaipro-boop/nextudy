"use client"

import { Button } from "@/components/ui/button"
import { toggleQuickQuestion } from "@/lib/quick-question-events"
import { Brain } from "lucide-react"

export function GlobalChatButton() {
  return (
    <div className="fixed bottom-5 right-6 z-50">
      <Button
        size="lg"
        onClick={toggleQuickQuestion}
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-black hover:bg-black/90 p-0 border-0"
      >
        <Brain className="h-7 w-7 text-white" />
      </Button>
    </div>
  )
}
