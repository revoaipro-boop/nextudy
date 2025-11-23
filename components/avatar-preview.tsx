"use client"

import { cn } from "@/lib/utils"

interface AvatarPreviewProps {
  avatarType: string
  accessories: string[]
  background: string
  backgroundColor?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const avatarEmojis: Record<string, string> = {
  default: "👤",
  cat: "🐱",
  dog: "🐶",
  robot: "🤖",
  alien: "👽",
  panda: "🐼",
  fox: "🦊",
  lion: "🦁",
  unicorn: "🦄",
  dragon: "🐉",
}

const accessoryEmojis: Record<string, string> = {
  glasses: "👓",
  sunglasses: "🕶️",
  hat: "🎩",
  cap: "🧢",
  crown: "👑",
  headphones: "🎧",
  party: "🎉",
  star: "⭐",
}

const backgroundStyles: Record<string, string> = {
  "gradient-blue": "bg-gradient-to-br from-blue-400 to-blue-600",
  "gradient-purple": "bg-gradient-to-br from-purple-400 to-purple-600",
  "gradient-pink": "bg-gradient-to-br from-pink-400 to-pink-600",
  "gradient-green": "bg-gradient-to-br from-green-400 to-green-600",
  "gradient-orange": "bg-gradient-to-br from-orange-400 to-orange-600",
  "gradient-rainbow": "bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400",
  solid: "",
}

const sizeClasses = {
  sm: "h-16 w-16 text-3xl",
  md: "h-24 w-24 text-5xl",
  lg: "h-32 w-32 text-6xl",
  xl: "h-48 w-48 text-8xl",
}

const accessorySizeClasses = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-6xl",
}

export function AvatarPreview({
  avatarType,
  accessories,
  background,
  backgroundColor,
  size = "lg",
  className,
}: AvatarPreviewProps) {
  const bgStyle = background === "solid" && backgroundColor ? { backgroundColor } : {}
  const bgClass = background === "solid" ? "" : backgroundStyles[background] || backgroundStyles["gradient-blue"]

  return (
    <div
      className={cn("relative rounded-full overflow-hidden shadow-lg", sizeClasses[size], bgClass, className)}
      style={bgStyle}
    >
      {/* Main Avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="select-none">{avatarEmojis[avatarType] || avatarEmojis.default}</span>
      </div>

      {/* Accessories */}
      {accessories.map((accessory) => (
        <div
          key={accessory}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: "translateY(-15%)",
          }}
        >
          <span className={cn("select-none", accessorySizeClasses[size])}>{accessoryEmojis[accessory]}</span>
        </div>
      ))}
    </div>
  )
}
