"use client"

import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Wand2, FileText, Brain, ListChecks } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface AIMenuProps {
  editor: Editor
  documentId: string
  onClose: () => void
}

export function AIMenu({ editor, documentId, onClose }: AIMenuProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const improveText = async () => {
    setLoading(true)
    try {
      const text = editor.getText()

      const response = await fetch("/api/ai/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const { improvedText } = await response.json()
      editor.commands.setContent(improvedText)

      toast({
        title: "Texte amélioré",
        description: "Votre texte a été reformulé et corrigé",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'améliorer le texte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const summarizeDocument = async () => {
    setLoading(true)
    try {
      const text = editor.getText()

      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const { summary } = await response.json()

      // Insert summary at the end
      editor.commands.focus("end")
      editor.commands.insertContent(`\n\n## Résumé\n\n${summary}`)

      toast({
        title: "Résumé généré",
        description: "Un résumé a été ajouté à la fin du document",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le résumé",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createRevisionSheet = async () => {
    setLoading(true)
    try {
      const text = editor.getText()

      const response = await fetch("/api/ai/create-revision-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const { revisionSheet } = await response.json()

      // Insert revision sheet at the end
      editor.commands.focus("end")
      editor.commands.insertContent(`\n\n## Fiche de Révision\n\n${revisionSheet}`)

      toast({
        title: "Fiche créée",
        description: "Une fiche de révision a été ajoutée",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la fiche",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createQCM = async () => {
    setLoading(true)
    try {
      const text = editor.getText()

      const response = await fetch("/api/ai/create-qcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const { qcm } = await response.json()

      // Insert QCM at the end
      editor.commands.focus("end")
      editor.commands.insertContent(`\n\n## QCM\n\n${qcm}`)

      toast({
        title: "QCM créé",
        description: "Un QCM a été ajouté à la fin du document",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le QCM",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Assistant IA
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
            onClick={improveText}
            disabled={loading}
          >
            <Wand2 className="h-4 w-4" />
            Améliorer mon texte
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
            onClick={summarizeDocument}
            disabled={loading}
          >
            <FileText className="h-4 w-4" />
            Résumer ce document
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
            onClick={createRevisionSheet}
            disabled={loading}
          >
            <Brain className="h-4 w-4" />
            Créer une fiche de révision
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
            onClick={createQCM}
            disabled={loading}
          >
            <ListChecks className="h-4 w-4" />
            Créer un QCM
          </Button>
        </div>

        {loading && <div className="text-center text-sm text-muted-foreground">Traitement en cours...</div>}
      </Card>
    </div>
  )
}
