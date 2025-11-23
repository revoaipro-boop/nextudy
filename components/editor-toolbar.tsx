"use client"

import type React from "react"

import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  ImageIcon,
  LinkIcon,
  Sparkles,
  Palette,
  Type,
  Table,
  Upload,
  Share2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface EditorToolbarProps {
  editor: Editor
  onAIClick: () => void
  documentId: string
}

export function EditorToolbar({ editor, onAIClick, documentId }: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState("#000000")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#FFD700",
    "#4B0082",
    "#FF6347",
    "#40E0D0",
    "#EE82EE",
    "#F5DEB3",
    "#FF1493",
    "#00CED1",
    "#FF4500",
    "#DA70D6",
    "#32CD32",
    "#FF69B4",
    "#8A2BE2",
    "#5F9EA0",
    "#D2691E",
    "#DC143C",
  ]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        editor.chain().focus().setImage({ src: base64 }).run()
        toast({
          title: "Image ajoutée",
          description: "L'image a été insérée dans le document",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'image",
        variant: "destructive",
      })
    }
  }

  const addImage = () => {
    const url = window.prompt("URL de l'image:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt("URL du lien:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const shareDocument = async () => {
    try {
      const { data, error } = await supabase
        .from("shared_chats")
        .insert({
          chat_id: documentId,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single()

      if (error) throw error

      const shareUrl = `${window.location.origin}/shared/${data.token}`
      await navigator.clipboard.writeText(shareUrl)

      toast({
        title: "Lien copié!",
        description: "Le lien de partage a été copié dans le presse-papier",
      })
    } catch (error) {
      console.error("[v0] Error sharing document:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien de partage",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-accent" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-accent" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "bg-accent" : ""}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "bg-accent" : ""}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run()
                    setShowColorPicker(false)
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center pt-2 border-t">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-12 h-8 p-1 cursor-pointer"
              />
              <Button
                size="sm"
                onClick={() => {
                  editor.chain().focus().setColor(customColor).run()
                  setShowColorPicker(false)
                }}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select
        value={editor.getAttributes("textStyle").fontSize || "16px"}
        onValueChange={(value) => {
          if (value === "default") {
            editor.chain().focus().unsetFontSize().run()
          } else {
            editor.chain().focus().setFontSize(value).run()
          }
        }}
      >
        <SelectTrigger className="w-[100px] h-8 text-xs">
          <SelectValue placeholder="Taille" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Normal</SelectItem>
          <SelectItem value="12px">12px</SelectItem>
          <SelectItem value="14px">14px</SelectItem>
          <SelectItem value="16px">16px</SelectItem>
          <SelectItem value="18px">18px</SelectItem>
          <SelectItem value="20px">20px</SelectItem>
          <SelectItem value="24px">24px</SelectItem>
          <SelectItem value="28px">28px</SelectItem>
          <SelectItem value="32px">32px</SelectItem>
          <SelectItem value="36px">36px</SelectItem>
          <SelectItem value="48px">48px</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={editor.getAttributes("textStyle").fontFamily || "default"}
        onValueChange={(value) => {
          if (value === "default") {
            editor.chain().focus().unsetFontFamily().run()
          } else {
            editor.chain().focus().setFontFamily(value).run()
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <Type className="h-3 w-3 mr-1" />
          <SelectValue placeholder="Police" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Par défaut</SelectItem>
          <SelectItem value="Arial">Arial</SelectItem>
          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
          <SelectItem value="Courier New">Courier New</SelectItem>
          <SelectItem value="Georgia">Georgia</SelectItem>
          <SelectItem value="Verdana">Verdana</SelectItem>
          <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
          <SelectItem value="Impact">Impact</SelectItem>
          <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-8" />

      {/* Headings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      {/* Alignment */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={editor.isActive({ textAlign: "justify" }) ? "bg-accent" : ""}
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-accent" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-accent" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive("taskList") ? "bg-accent" : ""}
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      {/* Insert */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={addImage}>
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={addLink}>
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "bg-accent" : ""}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertTable}>
        <Table className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <Button variant="ghost" size="sm" onClick={shareDocument}>
        <Share2 className="h-4 w-4" />
      </Button>

      {/* AI Button */}
      <Button variant="default" size="sm" onClick={onAIClick} className="gap-2">
        <Sparkles className="h-4 w-4" />
        IA
      </Button>
    </div>
  )
}
