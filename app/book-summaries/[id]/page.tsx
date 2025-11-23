"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, ArrowLeft, Trash2, Star } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface BookSummary {
  id: string
  book_title: string
  author: string | null
  isbn: string | null
  summary: string
  key_points: string[]
  themes: string[]
  quotes: string[]
  rating: number | null
  notes: string | null
  created_at: string
}

export default function BookSummaryDetailPage({ params }: { params: { id: string } }) {
  const [summary, setSummary] = useState<BookSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadSummary()
  }, [params.id])

  const loadSummary = async () => {
    try {
      const response = await fetch(`/api/book-summaries/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        router.push("/book-summaries")
      }
    } catch (error) {
      console.error("[v0] Error loading summary:", error)
      router.push("/book-summaries")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce résumé ?")) return

    try {
      const response = await fetch(`/api/book-summaries/${params.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/book-summaries")
      }
    } catch (error) {
      console.error("[v0] Error deleting summary:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/book-summaries" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="group-hover:scale-110 transition-all duration-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-black rounded-xl p-2.5">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight line-clamp-1">{summary.book_title}</h1>
            </div>
          </Link>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">{summary.book_title}</h2>
                  {summary.author && <p className="text-lg text-muted-foreground mt-2">par {summary.author}</p>}
                </div>
                {summary.rating && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    {Array.from({ length: summary.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                )}
              </div>

              {summary.isbn && <p className="text-sm text-muted-foreground">ISBN: {summary.isbn}</p>}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Résumé</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
            </div>

            {summary.key_points && summary.key_points.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Points clés</h3>
                <ul className="space-y-2">
                  {summary.key_points.map((point, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-primary font-semibold">•</span>
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.themes && summary.themes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Thèmes</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.themes.map((theme, i) => (
                    <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summary.quotes && summary.quotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Citations</h3>
                <div className="space-y-3">
                  {summary.quotes.map((quote, i) => (
                    <blockquote key={i} className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {summary.notes && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Notes personnelles</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{summary.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Créé le {new Date(summary.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
