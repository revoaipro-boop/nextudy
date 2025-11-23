"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Brain, TrendingUp, BookOpen, Sparkles } from "lucide-react"
import { KnowledgeGraph } from "@/components/knowledge-graph"

interface KnowledgeNode {
  id: string
  concept_name: string
  subject: string
  mastery_level: number
  times_reviewed: number
  last_reviewed_at: string | null
}

interface KnowledgeConnection {
  id: string
  from_node_id: string
  to_node_id: string
  connection_type: string
  strength: number
}

export default function KnowledgeMapPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [connections, setConnections] = useState<KnowledgeConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)

  useEffect(() => {
    fetchKnowledgeGraph()
  }, [])

  const fetchKnowledgeGraph = async () => {
    try {
      const response = await fetch("/api/knowledge-graph")
      if (response.ok) {
        const data = await response.json()
        setNodes(data.nodes || [])
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error("Error fetching knowledge graph:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMasteryColor = (level: number) => {
    if (level >= 80) return "text-green-500"
    if (level >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getMasteryLabel = (level: number) => {
    if (level >= 80) return "Maîtrisé"
    if (level >= 50) return "En cours"
    return "À revoir"
  }

  const totalConcepts = nodes.length
  const masteredConcepts = nodes.filter((n) => n.mastery_level >= 80).length
  const totalConnections = connections.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Network className="h-8 w-8 text-accent" />
          Réseau Neuronal de Connaissances
        </h1>
        <p className="text-foreground/70">
          Visualisez votre progression mentale et les connexions entre vos connaissances
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-foreground/70">Concepts totaux</span>
          </div>
          <p className="text-3xl font-bold">{totalConcepts}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-foreground/70">Concepts maîtrisés</span>
          </div>
          <p className="text-3xl font-bold">{masteredConcepts}</p>
          <p className="text-sm text-foreground/60 mt-1">
            {totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0}% de progression
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-foreground/70">Connexions</span>
          </div>
          <p className="text-3xl font-bold">{totalConnections}</p>
        </Card>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-foreground/60">Chargement de votre carte mentale...</p>
        </Card>
      ) : nodes.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Votre carte mentale est vide</h3>
          <p className="text-foreground/60 mb-6">Commencez à réviser pour construire votre réseau de connaissances</p>
          <Button onClick={() => (window.location.href = "/")}>Commencer à réviser</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Network className="h-5 w-5" />
                Carte interactive
              </h3>
              <KnowledgeGraph nodes={nodes} connections={connections} onNodeClick={setSelectedNode} />
            </Card>
          </div>

          <div className="space-y-4">
            {selectedNode ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Détails du concept</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Concept</p>
                    <p className="font-semibold">{selectedNode.concept_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Matière</p>
                    <Badge variant="secondary">{selectedNode.subject}</Badge>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60 mb-2">Niveau de maîtrise</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedNode.mastery_level >= 80
                              ? "bg-green-500"
                              : selectedNode.mastery_level >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${selectedNode.mastery_level}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getMasteryColor(selectedNode.mastery_level)}`}>
                        {selectedNode.mastery_level}%
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 mt-1">{getMasteryLabel(selectedNode.mastery_level)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Révisions</p>
                    <p className="font-semibold">{selectedNode.times_reviewed} fois</p>
                  </div>

                  {selectedNode.last_reviewed_at && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Dernière révision</p>
                      <p className="text-sm">{new Date(selectedNode.last_reviewed_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  )}

                  <Button className="w-full gap-2" onClick={() => {}}>
                    <BookOpen className="h-4 w-4" />
                    Réviser ce concept
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-foreground/60 text-center">Cliquez sur un nœud pour voir les détails</p>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Légende</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-sm">Maîtrisé (≥80%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span className="text-sm">En cours (50-79%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm">À revoir (&lt;50%)</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
