import { ChatInterfaceWrapper } from "@/components/chat-interface-wrapper"

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { conversationId } = await params
  const { subject, grade, format } = await searchParams

  return (
    <ChatInterfaceWrapper
      conversationId={conversationId === "new" ? null : conversationId}
      subject={(subject as string) || "général"}
      grade={(grade as string) || "lycée"}
      format={(format as "normal" | "kid" | "correction") || "normal"}
    />
  )
}
