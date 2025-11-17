"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Calculator,
  Globe,
  Atom,
  Music,
  Code,
  Languages,
  Microscope,
  Landmark,
  MoreHorizontal,
} from "lucide-react"

interface SubjectSelectorProps {
  onSubjectSelect: (subject: string, grade: string) => void
}

const predefinedSubjects = [
  { name: "Mathématiques", icon: Calculator, color: "text-blue-500" },
  { name: "Physique", icon: Atom, color: "text-purple-500" },
  { name: "Chimie", icon: Microscope, color: "text-green-500" },
  { name: "Histoire", icon: Landmark, color: "text-amber-500" },
  { name: "Géographie", icon: Globe, color: "text-teal-500" },
  { name: "Français", icon: BookOpen, color: "text-rose-500" },
  { name: "Anglais", icon: Languages, color: "text-indigo-500" },
  { name: "Informatique", icon: Code, color: "text-cyan-500" },
  { name: "Musique", icon: Music, color: "text-violet-500" },
  { name: "Autre", icon: MoreHorizontal, color: "text-gray-500" },
]

const grades = [
  "6ème",
  "5ème",
  "4ème",
  "3ème", // Collège
  "Seconde",
  "Première",
  "Terminale", // Lycée
]

export function SubjectSelector({ onSubjectSelect }: SubjectSelectorProps) {
  const [step, setStep] = useState<"subject" | "grade">("subject")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [customSubject, setCustomSubject] = useState("")

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject)
    setStep("grade")
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customSubject.trim()) {
      setSelectedSubject(customSubject.trim())
      setStep("grade")
    }
  }

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade)
    onSubjectSelect(selectedSubject, grade)
  }

  if (step === "subject") {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-balance">
            Libère la puissance de l'IA pour tes révisions
          </h2>
          <p className="text-lg text-foreground/80 text-pretty max-w-2xl mx-auto">
            ChatGPT transmet, Gemini crée, Perplexity précise — cette IA éduque.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {predefinedSubjects.map((subject) => {
            const Icon = subject.icon
            return (
              <Card
                key={subject.name}
                className="p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                onClick={() => handleSubjectClick(subject.name)}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`${subject.color} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="font-medium text-sm">{subject.name}</span>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="max-w-md mx-auto">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Entre une autre matière..."
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!customSubject.trim()}>
              Suivant
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (step === "grade") {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-balance">Quelle est ta classe ?</h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Matière sélectionnée : <span className="font-semibold text-foreground">{selectedSubject}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {grades.map((grade) => (
            <Card
              key={grade}
              className="p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
              onClick={() => handleGradeSelect(grade)}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-2xl font-bold">{grade}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setStep("subject")}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return null
}
