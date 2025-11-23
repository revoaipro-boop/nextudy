import type { Metadata } from "next"

import SignUpClientPage from "./SignUpClientPage"

export const metadata: Metadata = {
  title: "Inscription Nextudy - Crée ton compte gratuit",
  description:
    "Inscris-toi sur Nextudy pour profiter des flashcards illimitées, des résumés de livres et des outils d'apprentissage en ligne.",
  keywords: ["inscription Nextudy", "créer compte", "abonnement gratuit", "outils d'apprentissage"],
  openGraph: {
    title: "Inscription Nextudy - Crée ton compte gratuit",
    description:
      "Inscris-toi sur Nextudy pour profiter des flashcards illimitées, des résumés de livres et des outils d'apprentissage en ligne.",
    images: ["/og-image.png"],
  },
}

export default function SignUpPage() {
  return <SignUpClientPage />
}
