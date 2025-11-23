import type { Metadata } from "next"

import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Nextudy - Apprentissage en ligne et résumés de livres",
  description:
    "Nextudy propose des flashcards illimitées, des résumés de livres et des outils pour apprendre efficacement en ligne.",
  keywords: ["apprentissage en ligne", "flashcards", "résumés de livres", "étude efficace", "outils d'apprentissage"],
  openGraph: {
    title: "Nextudy - Apprentissage en ligne et résumés de livres",
    description:
      "Nextudy propose des flashcards illimitées, des résumés de livres et des outils pour apprendre efficacement en ligne.",
    images: ["/og-image.png"],
  },
}

export default function Page() {
  return <ClientPage />
}
