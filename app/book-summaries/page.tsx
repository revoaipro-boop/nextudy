import type { Metadata } from "next"
import BookSummariesClient from "./book-summaries-client"

export const metadata: Metadata = {
  title: "Résumés de livres - Apprends vite avec Nextudy",
  description: "Accède aux résumés de livres sur Nextudy pour gagner du temps et apprendre l'essentiel rapidement.",
  keywords: ["résumés de livres", "lecture rapide", "apprentissage efficace", "synthèse de livres"],
  openGraph: {
    title: "Résumés de livres - Apprends vite avec Nextudy",
    description: "Accède aux résumés de livres sur Nextudy pour gagner du temps et apprendre l'essentiel rapidement.",
    images: ["/og-image.png"],
  },
}

export default function BookSummariesPage() {
  return <BookSummariesClient />
}
