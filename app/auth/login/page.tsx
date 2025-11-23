import type { Metadata } from "next"

import LoginPageClient from "./_components/LoginPageClient"

export const metadata: Metadata = {
  title: "Connexion Nextudy - Accède à ton compte",
  description: "Connecte-toi à ton compte Nextudy pour accéder à tes flashcards, résumés et outils d'apprentissage.",
  keywords: ["connexion Nextudy", "login compte", "accès utilisateur", "espace membre"],
  openGraph: {
    title: "Connexion Nextudy - Accède à ton compte",
    description: "Connecte-toi à ton compte Nextudy pour accéder à tes flashcards, résumés et outils d'apprentissage.",
    images: ["/og-image.png"],
  },
}

export default function LoginPage() {
  return <LoginPageClient />
}
