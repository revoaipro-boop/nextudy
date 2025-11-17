"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { SummaryDisplay } from "@/components/summary-display"
import type { QCMQuestion } from "@/components/qcm-display"

interface Summary {
  id: string
  summary: string
  short_summary: string
  keywords: Array<{ term: string; definition: string }>
  filename: string
  flashcards: Array<{ question: string; answer: string }>
  qcm?: QCMQuestion[]
  subject: string
  text_content?: string
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch(`/api/summaries/${params.id}`)

        if (response.status === 401) {
          router.push("/auth/login")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch summary")
        }

        const data = await response.json()
        console.log("[v0] Fetched summary data:", {
          hasQCM: !!data.qcm,
          qcmLength: data.qcm?.length || 0,
          hasTextContent: !!data.text_content,
        })
        setSummary(data)
      } catch (err) {
        console.error("[v0] Error fetching summary:", err)
        setError("Failed to load summary")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Summary not found"}</p>
          <Link href="/">
            <Button variant="outline">Retour à l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 animate-fade-in">
        <SummaryDisplay
          summary={summary.summary}
          shortSummary={summary.short_summary}
          keywords={summary.keywords}
          filename={summary.filename}
          flashcards={summary.flashcards}
          qcm={summary.qcm}
          subject={summary.subject}
          summaryId={summary.id}
          textContent={summary.text_content}
          onReset={() => {}}
        />
      </div>
    </div>
  )
}
