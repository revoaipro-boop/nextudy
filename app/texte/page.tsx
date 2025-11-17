import type { Metadata } from "next"
import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Outils de lecture et texte - Nextudy",
  description:
    "Profite des outils de lecture et traitement de texte sur Nextudy pour améliorer ton apprentissage et tes révisions.",
  keywords: ["texte éducatif", "lecture en ligne", "outils d'apprentissage", "traitement de texte", "étude efficace"],
  openGraph: {
    title: "Outils de lecture et texte - Nextudy",
    description:
      "Profite des outils de lecture et traitement de texte sur Nextudy pour améliorer ton apprentissage et tes révisions.",
    images: ["/og-image.png"],
  },
}

export default function Page() {
  return <ClientPage />
}
