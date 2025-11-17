import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import ChatInterfaceWrapper from '@/components/chat-interface-wrapper'

export default function ConversationPage({
  params,
  searchParams,
}: {
  params: { conversationId: string }
  searchParams: { subject?: string; grade?: string; format?: string }
}) {
  const subject = searchParams.subject || "Mathématiques"
  const grade = searchParams.grade || "Lycée"
  const format = (searchParams.format as "normal" | "kid" | "correction") || "normal"

  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <div className="h-screen w-full">
        <ChatInterfaceWrapper
          conversationId={params.conversationId}
          subject={subject}
          grade={grade}
          format={format}
        />
      </div>
    </Suspense>
  )
}
