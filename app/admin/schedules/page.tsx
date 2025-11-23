"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Save, X, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface Schedule {
  id: string
  name: string
  description: string | null
  schedule_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminSchedulesPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule_time: "18:00",
    is_active: true,
  })

  useEffect(() => {
    checkAdminAndLoadSchedules()
  }, [])

  const checkAdminAndLoadSchedules = async () => {
    try {
      // Check if user is admin
      const response = await fetch("/api/admin/schedules")
      if (response.status === 403) {
        router.push("/")
        return
      }

      if (!response.ok) throw new Error("Failed to load schedules")

      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error("Error loading schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const response = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to add schedule")

      await checkAdminAndLoadSchedules()
      setShowAddForm(false)
      setFormData({ name: "", description: "", schedule_time: "18:00", is_active: true })
    } catch (error) {
      console.error("Error adding schedule:", error)
      alert("Erreur lors de l'ajout du planning")
    }
  }

  const handleUpdate = async (id: string, updates: Partial<Schedule>) => {
    try {
      const response = await fetch("/api/admin/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) throw new Error("Failed to update schedule")

      await checkAdminAndLoadSchedules()
      setEditingId(null)
    } catch (error) {
      console.error("Error updating schedule:", error)
      alert("Erreur lors de la mise à jour du planning")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce planning ?")) return

    try {
      const response = await fetch("/api/admin/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error("Failed to delete schedule")

      await checkAdminAndLoadSchedules()
    } catch (error) {
      console.error("Error deleting schedule:", error)
      alert("Erreur lors de la suppression du planning")
    }
  }

  const handleToggleActive = async (id: string, is_active: boolean) => {
    await handleUpdate(id, { is_active })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion des Plannings de Rappels</h1>
        <p className="text-muted-foreground">Configurez les horaires d'envoi des rappels quotidiens par email</p>
      </div>

      <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Limitation du plan Hobby</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Le plan Hobby de Vercel limite les cron jobs à une exécution par jour. Actuellement, les rappels sont
                envoyés à <strong>18:00 UTC (19h/20h heure française)</strong> à tous les utilisateurs ayant activé les
                notifications.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                Pour envoyer des rappels à des horaires personnalisés, vous devrez passer au plan Pro de Vercel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <Button onClick={() => setShowAddForm(!showAddForm)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un planning (Pro uniquement)
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouveau Planning</CardTitle>
            <CardDescription>Créez un nouvel horaire de rappel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du planning</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Rappel du matin"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="time">Heure d'envoi</Label>
              <Input
                id="time"
                type="time"
                value={formData.schedule_time}
                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active">Actif</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ name: "", description: "", schedule_time: "18:00", is_active: true })
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun planning configuré. Ajoutez-en un pour commencer.
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="pt-6">
                {editingId === schedule.id ? (
                  <div className="space-y-4">
                    <Input
                      value={schedule.name}
                      onChange={(e) =>
                        setSchedules(schedules.map((s) => (s.id === schedule.id ? { ...s, name: e.target.value } : s)))
                      }
                    />
                    <Textarea
                      value={schedule.description || ""}
                      onChange={(e) =>
                        setSchedules(
                          schedules.map((s) => (s.id === schedule.id ? { ...s, description: e.target.value } : s)),
                        )
                      }
                      rows={2}
                    />
                    <Input
                      type="time"
                      value={schedule.schedule_time}
                      onChange={(e) =>
                        setSchedules(
                          schedules.map((s) => (s.id === schedule.id ? { ...s, schedule_time: e.target.value } : s)),
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleUpdate(schedule.id, {
                            name: schedule.name,
                            description: schedule.description,
                            schedule_time: schedule.schedule_time,
                          })
                        }
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{schedule.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${schedule.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                        >
                          {schedule.is_active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      {schedule.description && (
                        <p className="text-sm text-muted-foreground mb-2">{schedule.description}</p>
                      )}
                      <p className="text-2xl font-bold text-primary">{schedule.schedule_time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => handleToggleActive(schedule.id, checked)}
                      />
                      <Button variant="outline" size="icon" onClick={() => setEditingId(schedule.id)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(schedule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
