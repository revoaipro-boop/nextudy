import { Suspense } from 'react'
import ChatInterface from "@/components/chat-interface"
import { SearchParamsWrapper } from "./search-params-wrapper"

export default function ChatIAPage() {
  return (
    <div className="h-screen w-full">
      <Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Chargement du chat...</p>
          </div>
        </div>
      }>
        <SearchParamsWrapper />
      </Suspense>
    </div>
  )
}
