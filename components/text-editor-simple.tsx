"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"

interface SimpleTextEditorProps {
  initialText: string
  filename?: string
  onSave: (text: string) => void | Promise<void>
  onCancel: () => void
}

export function SimpleTextEditor({ initialText, filename, onSave, onCancel }: SimpleTextEditorProps) {
  const [text, setText] = useState(initialText)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return

    setIsSaving(true)
    try {
      await onSave(text)
    } finally {
      // Don't reset isSaving here since we're moving to processing
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {filename && <p className="text-sm text-muted-foreground">{filename}</p>}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
          placeholder="Modifiez la transcription ici..."
          disabled={isSaving}
        />
        <p className="text-xs text-muted-foreground">{text.length} caractères</p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="mr-2 h-4 w-4" />
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={!text.trim() || isSaving}>
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Lancement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer et continuer
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
