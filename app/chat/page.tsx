import type { Metadata } from "next"
import ChatClientPage from "./chat-client"

export const metadata: Metadata = {
  title: "Chat Nextudy - Pose tes questions et apprends",
  description:
    "Utilise le chat de Nextudy pour poser tes questions et recevoir des réponses rapides et fiables pour mieux apprendre.",
  keywords: ["chat éducatif", "aide aux devoirs", "questions-réponses", "apprendre en ligne"],
  openGraph: {
    title: "Chat Nextudy - Pose tes questions et apprends",
    description:
      "Utilise le chat de Nextudy pour poser tes questions et recevoir des réponses rapides et fiables pour mieux apprendre.",
    images: ["/og-image.png"],
  },
}

export default function ChatPage() {
  return <ChatClientPage />
}
