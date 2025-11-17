import { createClient } from "@/lib/supabase/client"

export interface SavedSummary {
  id: string
  filename: string
  summary: string
  shortSummary?: string
  keywords?: Array<{ term: string; definition: string }>
  flashcards: Array<{ question: string; answer: string }>
  qcm?: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }>
  subject?: string
  createdAt: string
  type: "document" | "audio"
  user_id?: string
  textContent?: string
}

export const storage = {
  async getSummaries(): Promise<SavedSummary[]> {
    if (typeof window === "undefined") return []

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Fetch from Supabase for authenticated users
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        return data.map((item) => ({
          id: item.id,
          filename: item.filename,
          summary: item.summary,
          shortSummary: item.short_summary,
          keywords: item.keywords,
          flashcards: item.flashcards,
          qcm: item.qcm,
          subject: item.subject,
          createdAt: item.created_at,
          type: item.type,
          user_id: item.user_id,
          textContent: item.text_content,
        }))
      }
    }

    const data = localStorage.getItem("nextudy-summaries")
    return data ? JSON.parse(data) : []
  },

  async saveSummary(summary: Omit<SavedSummary, "id" | "createdAt">): Promise<SavedSummary> {
    console.log("[v0] Starting saveSummary")
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] User auth status:", { hasUser: !!user, authError })

    if (user) {
      // Save to Supabase for authenticated users
      console.log("[v0] Attempting to save to Supabase")
      const { data, error } = await supabase
        .from("summaries")
        .insert({
          user_id: user.id,
          filename: summary.filename,
          summary: summary.summary,
          short_summary: summary.shortSummary,
          keywords: summary.keywords,
          flashcards: summary.flashcards,
          qcm: summary.qcm,
          subject: summary.subject,
          type: summary.type,
          text_content: summary.textContent,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Supabase save error:", error)
        // Fall through to localStorage fallback
      } else if (data) {
        console.log("[v0] Successfully saved to Supabase:", data.id)
        // Update streak when saving a summary
        try {
          await fetch("/api/streak", { method: "POST" })
        } catch (streakError) {
          console.error("[v0] Streak update error:", streakError)
          // Don't fail the whole operation if streak update fails
        }

        return {
          id: data.id,
          filename: data.filename,
          summary: data.summary,
          shortSummary: data.short_summary,
          keywords: data.keywords,
          flashcards: data.flashcards,
          qcm: data.qcm,
          subject: data.subject,
          createdAt: data.created_at,
          type: data.type,
          user_id: data.user_id,
          textContent: data.text_content,
        }
      }
    }

    console.log("[v0] Saving to localStorage")
    const summaries = await this.getSummaries()
    const newSummary: SavedSummary = {
      ...summary,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    summaries.unshift(newSummary)
    localStorage.setItem("nextudy-summaries", JSON.stringify(summaries))
    console.log("[v0] Successfully saved to localStorage:", newSummary.id)
    return newSummary
  },

  async deleteSummary(id: string): Promise<void> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Delete from Supabase for authenticated users
      await supabase.from("summaries").delete().eq("id", id).eq("user_id", user.id)
      return
    }

    const summaries = await this.getSummaries()
    const filtered = summaries.filter((s) => s.id !== id)
    localStorage.setItem("nextudy-summaries", JSON.stringify(filtered))
  },
}
