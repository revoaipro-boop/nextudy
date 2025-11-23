"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, GripVertical } from "lucide-react"
import { TaskCard } from "./task-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  importance?: number // Optional since DB doesn't have this column yet
  due_date: string | null
  created_at: string
}

interface TascInterfaceProps {
  initialTodos: Task[]
  userId: string
}

export function TascInterface({ initialTodos, userId }: TascInterfaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTodos)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    importance: 5, // default to medium
    importanceLevel: "medium" as "low" | "medium" | "high",
  })
  const supabase = createClient()

  const getImportanceFromLevel = (level: "low" | "medium" | "high"): number => {
    if (level === "low") return 2
    if (level === "medium") return 5
    return 9
  }

  const getPriorityFromImportance = (importance: number): "low" | "medium" | "high" => {
    if (importance >= 8) return "high"
    if (importance >= 4) return "medium"
    return "low"
  }

  const getImportanceFromPriority = (priority: string): number => {
    if (priority === "high") return 9
    if (priority === "medium") return 5
    return 2
  }

  const activeTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const aImportance = a.importance ?? getImportanceFromPriority(a.priority)
      const bImportance = b.importance ?? getImportanceFromPriority(b.priority)
      return bImportance - aImportance
    })
  const completedTasks = tasks.filter((t) => t.completed)

  const addTask = async () => {
    console.log("[v0] Adding task:", newTask)

    if (!newTask.title.trim()) {
      console.log("[v0] Task title is empty, aborting")
      return
    }

    const importance = getImportanceFromLevel(newTask.importanceLevel)
    const priority = getPriorityFromImportance(importance)

    console.log("[v0] Inserting task with priority:", priority, "importance:", importance)

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: userId,
        title: newTask.title,
        description: null,
        priority: priority,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding task:", error)
      return
    }

    if (data) {
      console.log("[v0] Task added successfully:", data)
      const taskWithImportance = { ...data, importance: importance }
      setTasks([...tasks, taskWithImportance])
      setNewTask({ title: "", importance: 5, importanceLevel: "medium" })
      setIsAddDialogOpen(false)
    }
  }

  const toggleComplete = async (task: Task) => {
    console.log("[v0] Toggling task completion:", task.id)
    const { error } = await supabase.from("todos").update({ completed: !task.completed }).eq("id", task.id)

    if (error) {
      console.error("[v0] Error toggling task:", error)
      return
    }

    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)))
  }

  const deleteTask = async (id: string) => {
    console.log("[v0] Deleting task:", id)
    const { error } = await supabase.from("todos").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting task:", error)
      return
    }

    setTasks(tasks.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Tâches</h1>
        <p className="text-sm text-muted-foreground">Gestion de tâches par importance</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          Tâches actives
        </h2>

        {activeTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Aucune tâche active</p>
            <p className="text-xs mt-1">Appuyez sur + pour ajouter une tâche</p>
            <p className="text-xs mt-1 text-primary">Glissez une tâche vers la droite pour la compléter →</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggleComplete={toggleComplete} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground">Tâches complétées</h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggleComplete={toggleComplete} onDelete={deleteTask} />
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          size="lg"
          onClick={() => {
            console.log("[v0] Opening add task dialog")
            setIsAddDialogOpen(true)
          }}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la tâche</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Ex: Réviser le chapitre 3"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTask()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance-level">Niveau d'importance</Label>
              <Select
                value={newTask.importanceLevel}
                onValueChange={(value: "low" | "medium" | "high") => {
                  const importance = getImportanceFromLevel(value)
                  setNewTask({ ...newTask, importanceLevel: value, importance })
                }}
              >
                <SelectTrigger id="importance-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Faible
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      Moyen
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Important
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addTask} className="w-full" disabled={!newTask.title.trim()}>
              Ajouter la tâche
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
