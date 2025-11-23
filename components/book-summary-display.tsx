"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Users, Lightbulb, Quote, Clock, Printer } from "lucide-react"

interface BookSummaryDisplayProps {
  title: string
  author: string
  editionYear?: string
  content: string
}

interface Section {
  id: string
  title: string
  content: string
  icon?: React.ReactNode
}

export function BookSummaryDisplay({ title, author, editionYear, content }: BookSummaryDisplayProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState<string>("")

  useEffect(() => {
    if (!content || content.trim().length === 0) {
      console.error("[v0] BookSummaryDisplay: No content to display")
      setSections([])
      return
    }

    console.log("[v0] BookSummaryDisplay: Parsing content, length:", content.length)

    // Parse the markdown content into sections
    const lines = content.split("\n")
    const parsedSections: Section[] = []
    let currentSection: Section | null = null

    lines.forEach((line) => {
      // Match headers like ## Section Title or ### Section Title
      const headerMatch = line.match(/^#{2,3}\s+(.+)$/)

      if (headerMatch) {
        if (currentSection) {
          parsedSections.push(currentSection)
        }

        const sectionTitle = headerMatch[1].trim()
        const sectionId = sectionTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")

        currentSection = {
          id: sectionId,
          title: sectionTitle,
          content: "",
          icon: getSectionIcon(sectionTitle),
        }
      } else if (currentSection) {
        currentSection.content += line + "\n"
      }
    })

    if (currentSection) {
      parsedSections.push(currentSection)
    }

    if (parsedSections.length === 0) {
      console.log("[v0] BookSummaryDisplay: No sections found, displaying raw content")
      parsedSections.push({
        id: "full-summary",
        title: "Résumé complet",
        content: content,
        icon: <BookOpen className="h-4 w-4" />,
      })
    }

    console.log("[v0] BookSummaryDisplay: Parsed sections:", parsedSections.length)
    setSections(parsedSections)
    if (parsedSections.length > 0) {
      setActiveSection(parsedSections[0].id)
    }
  }, [content])

  const getSectionIcon = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes("fiche") || lowerTitle.includes("technique")) return <FileText className="h-4 w-4" />
    if (lowerTitle.includes("personnage")) return <Users className="h-4 w-4" />
    if (lowerTitle.includes("thème") || lowerTitle.includes("symbole")) return <Lightbulb className="h-4 w-4" />
    if (lowerTitle.includes("citation") || lowerTitle.includes("quote")) return <Quote className="h-4 w-4" />
    if (lowerTitle.includes("temps") || lowerTitle.includes("durée")) return <Clock className="h-4 w-4" />
    return <BookOpen className="h-4 w-4" />
  }

  const handlePrint = () => {
    window.print()
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (!content || content.trim().length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Aucun résumé à afficher</h3>
        <p className="text-muted-foreground">Le contenu du résumé est vide ou n'a pas pu être généré.</p>
      </Card>
    )
  }

  if (sections.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">par {author}</p>
            {editionYear && <p className="text-sm text-muted-foreground">Édition: {editionYear}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 print:hidden bg-transparent">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 print:bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">par {author}</p>
            {editionYear && <p className="text-sm text-muted-foreground">Édition: {editionYear}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 print:hidden bg-transparent">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents - Sidebar */}
        <aside className="lg:col-span-1 print:hidden">
          <Card className="p-4 sticky top-20">
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Table des matières
            </h2>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {section.icon}
                  <span className="line-clamp-1">{section.title}</span>
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {sections.map((section, index) => (
            <Card key={section.id} id={section.id} className="p-6 scroll-mt-20 print:break-inside-avoid">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{section.icon}</div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>

              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h3:text-lg prose-h4:text-base prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold">
                {section.content.split("\n").map((line, lineIndex) => {
                  // Handle different markdown elements
                  if (line.startsWith("###")) {
                    return (
                      <h3 key={lineIndex} className="mt-6 mb-3">
                        {line.replace(/^###\s+/, "")}
                      </h3>
                    )
                  } else if (line.startsWith("####")) {
                    return (
                      <h4 key={lineIndex} className="mt-4 mb-2">
                        {line.replace(/^####\s+/, "")}
                      </h4>
                    )
                  } else if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <p key={lineIndex} className="font-semibold mt-3 mb-2">
                        {line.replace(/\*\*/g, "")}
                      </p>
                    )
                  } else if (line.startsWith("- ") || line.startsWith("* ")) {
                    return (
                      <li key={lineIndex} className="ml-4">
                        {line.replace(/^[-*]\s+/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}
                      </li>
                    )
                  } else if (line.startsWith(">")) {
                    return (
                      <blockquote
                        key={lineIndex}
                        className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
                      >
                        {line.replace(/^>\s+/, "")}
                      </blockquote>
                    )
                  } else if (line.trim() === "") {
                    return <div key={lineIndex} className="h-2" />
                  } else {
                    // Regular paragraph with bold text support
                    const parts = line.split(/(\*\*.*?\*\*)/)
                    return (
                      <p key={lineIndex} className="leading-relaxed mb-3">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={partIndex} className="font-semibold">
                                {part.replace(/\*\*/g, "")}
                              </strong>
                            )
                          }
                          return <span key={partIndex}>{part}</span>
                        })}
                      </p>
                    )
                  }
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
