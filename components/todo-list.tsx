"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2 } from "lucide-react"

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  due_date: string | null
  created_at: string
}

interface TodoListProps {
  initialTodos: Todo[]
  userId: string
}

export function TodoList({ initialTodos, userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
  })
  const supabase = createClient()

  const addTodo = async () => {
    if (!newTodo.title.trim()) return

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: userId,
        title: newTodo.title,
        description: newTodo.description || null,
        priority: newTodo.priority,
        due_date: newTodo.due_date || null,
      })
      .select()
      .single()

    if (!error && data) {
      setTodos([data, ...todos])
      setNewTodo({ title: "", description: "", priority: "medium", due_date: "" })
      setIsAddDialogOpen(false)
    }
  }

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const { error } = await supabase.from("todos").update(updates).eq("id", id)

    if (!error) {
      setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)))
      setEditingTodo(null)
    }
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id)

    if (!error) {
      setTodos(todos.filter((todo) => todo.id !== id))
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    await updateTodo(id, { completed: !completed })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return ""
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Haute"
      case "medium":
        return "Moyenne"
      case "low":
        return "Basse"
      default:
        return priority
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une tâche
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                placeholder="Titre de la tâche"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                placeholder="Description (optionnel)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={newTodo.priority}
                onValueChange={(value: any) => setNewTodo({ ...newTodo, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Date d&apos;échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={newTodo.due_date}
                onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
              />
            </div>
            <Button onClick={addTodo} className="w-full">
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {editingTodo && (
        <Dialog open={!!editingTodo} onOpenChange={() => setEditingTodo(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier la tâche</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTodo.description || ""}
                  onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priorité</Label>
                <Select
                  value={editingTodo.priority}
                  onValueChange={(value: any) => setEditingTodo({ ...editingTodo, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Date d&apos;échéance</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={editingTodo.due_date || ""}
                  onChange={(e) => setEditingTodo({ ...editingTodo, due_date: e.target.value })}
                />
              </div>
              <Button onClick={() => updateTodo(editingTodo.id, editingTodo)} className="w-full">
                Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
            Aucune tâche. Ajoutez-en une pour commencer !
          </p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => toggleComplete(todo.id, todo.completed)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <h3
                    className={`font-medium text-sm sm:text-base break-words ${todo.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {todo.title}
                  </h3>
                  <span className={`text-xs font-medium ${getPriorityColor(todo.priority)} whitespace-nowrap`}>
                    {getPriorityLabel(todo.priority)}
                  </span>
                </div>
                {todo.description && (
                  <p
                    className={`text-xs sm:text-sm text-muted-foreground break-words ${todo.completed ? "line-through" : ""}`}
                  >
                    {todo.description}
                  </p>
                )}
                {todo.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Échéance: {new Date(todo.due_date).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingTodo(todo)}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
