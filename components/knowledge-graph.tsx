"use client"

import { useEffect, useRef } from "react"

interface Node {
  id: string
  concept_name: string
  subject: string
  mastery_level: number
  times_reviewed: number
}

interface Connection {
  id: string
  from_node_id: string
  to_node_id: string
  connection_type: string
  strength: number
}

interface KnowledgeGraphProps {
  nodes: Node[]
  connections: Connection[]
  onNodeClick: (node: Node) => void
}

export function KnowledgeGraph({ nodes, connections, onNodeClick }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const container = containerRef.current
    canvas.width = container.clientWidth
    canvas.height = 600

    // Simple force-directed layout simulation
    const nodePositions = new Map<string, { x: number; y: number; vx: number; vy: number }>()

    // Initialize node positions randomly
    nodes.forEach((node) => {
      nodePositions.set(node.id, {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
      })
    })

    // Simulation parameters
    const iterations = 100
    const repulsionStrength = 5000
    const attractionStrength = 0.01
    const damping = 0.8

    // Run force-directed layout
    for (let iter = 0; iter < iterations; iter++) {
      // Apply repulsion between all nodes
      nodes.forEach((node1) => {
        const pos1 = nodePositions.get(node1.id)!
        nodes.forEach((node2) => {
          if (node1.id === node2.id) return
          const pos2 = nodePositions.get(node2.id)!

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          const force = repulsionStrength / (distance * distance)
          pos1.vx -= (force * dx) / distance
          pos1.vy -= (force * dy) / distance
        })
      })

      // Apply attraction along connections
      connections.forEach((conn) => {
        const pos1 = nodePositions.get(conn.from_node_id)
        const pos2 = nodePositions.get(conn.to_node_id)
        if (!pos1 || !pos2) return

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        const force = distance * attractionStrength
        pos1.vx += (force * dx) / distance
        pos1.vy += (force * dy) / distance
        pos2.vx -= (force * dx) / distance
        pos2.vy -= (force * dy) / distance
      })

      // Update positions
      nodePositions.forEach((pos) => {
        pos.x += pos.vx
        pos.y += pos.vy
        pos.vx *= damping
        pos.vy *= damping

        // Keep within bounds
        pos.x = Math.max(50, Math.min(canvas.width - 50, pos.x))
        pos.y = Math.max(50, Math.min(canvas.height - 50, pos.y))
      })
    }

    // Draw connections
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1
    connections.forEach((conn) => {
      const pos1 = nodePositions.get(conn.from_node_id)
      const pos2 = nodePositions.get(conn.to_node_id)
      if (!pos1 || !pos2) return

      ctx.beginPath()
      ctx.moveTo(pos1.x, pos1.y)
      ctx.lineTo(pos2.x, pos2.y)
      ctx.stroke()
    })

    // Draw nodes
    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      // Node color based on mastery
      const color = node.mastery_level >= 80 ? "#22c55e" : node.mastery_level >= 50 ? "#eab308" : "#ef4444"

      // Draw node circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2)
      ctx.fill()

      // Draw node label
      ctx.fillStyle = "#fff"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const label = node.concept_name.length > 15 ? node.concept_name.substring(0, 12) + "..." : node.concept_name
      ctx.fillText(label, pos.x, pos.y)
    })

    // Handle clicks
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      nodes.forEach((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return

        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
        if (distance <= 20) {
          onNodeClick(node)
        }
      })
    }

    canvas.addEventListener("click", handleClick)
    return () => canvas.removeEventListener("click", handleClick)
  }, [nodes, connections, onNodeClick])

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full border border-border rounded-lg cursor-pointer" />
    </div>
  )
}
