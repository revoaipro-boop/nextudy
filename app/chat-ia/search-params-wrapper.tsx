"use client"

import { useSearchParams } from 'next/navigation'
import ChatInterface from "@/components/chat-interface"

export function SearchParamsWrapper() {
  const searchParams = useSearchParams()
  
  const subject = searchParams.get("subject") || "Mathématiques"
  const grade = searchParams.get("grade") || "Lycée"
  const format = (searchParams.get("format") as "normal" | "kid" | "correction") || "normal"

  return (
    <ChatInterface
      subject={subject}
      grade={grade}
      format={format}
    />
  )
}
