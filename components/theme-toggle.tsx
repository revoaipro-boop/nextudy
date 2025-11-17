"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <Label htmlFor="dark-mode" className="text-sm font-medium">
          Mode sombre
        </Label>
        <Switch id="dark-mode" disabled />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="dark-mode" className="text-sm font-medium">
        Mode sombre
      </Label>
      <Switch
        id="dark-mode"
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  )
}
