"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { Image } from "@tiptap/extension-image"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { FontFamily } from "@tiptap/extension-font-family"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { FontSize } from "@tiptap/extension-font-size"
import { useState, useCallback, useRef } from "react"
import { EditorToolbar } from "./editor-toolbar"
import { AIMenu } from "./ai-menu"

interface TextEditorProps {
  content: any
  onChange: (content: any) => void
  documentId: string
  readOnly?: boolean
}

export function TextEditor({ content, onChange, documentId, readOnly = false }: TextEditorProps) {
  const [showAIMenu, setShowAIMenu] = useState(false)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleUpdate = useCallback(
    (json: any) => {
      // Debounce updates to reduce lag
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }

      updateTimerRef.current = setTimeout(() => {
        onChange(json)
      }, 300) // Wait 300ms after user stops typing
    },
    [onChange],
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-gray-300 dark:border-gray-600",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-bold p-2",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600 p-2",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      Color,
      FontSize,
      FontFamily.configure({
        types: ["textStyle"],
      }),
    ],
    content: content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[600px] max-w-none p-8 prose-table:border-collapse prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-2 prose-td:p-2",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      handleUpdate(json)
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm">
      {!readOnly && <EditorToolbar editor={editor} onAIClick={() => setShowAIMenu(true)} documentId={documentId} />}

      <div className="bg-white dark:bg-gray-900 rounded-b-lg">
        <EditorContent editor={editor} />
      </div>

      {showAIMenu && !readOnly && (
        <AIMenu editor={editor} documentId={documentId} onClose={() => setShowAIMenu(false)} />
      )}
    </div>
  )
}
