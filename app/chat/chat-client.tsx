"use client"

import { useState, useEffect } from "react"
import { ChatInterfaceRedesigned } from "@/components/chat-interface-redesigned"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ChatClientPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleReset = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ChatInterfaceRedesigned
      subject="" // Empty subject - AI will adapt to user questions
      grade="" // Empty grade - AI will adapt to user level
      format="normal" // Default to normal mode
      onReset={handleReset}
    />
  )
}
