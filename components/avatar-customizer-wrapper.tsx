"use client"

import { AvatarCustomizer } from "./avatar-customizer"
import { updateAvatar } from "@/app/actions/update-avatar"

interface AvatarCustomizerWrapperProps {
  userId: string
  initialAvatarType: string
  initialAccessories: string[]
  initialBackground: string
  initialBackgroundColor: string | null
}

export function AvatarCustomizerWrapper({
  userId,
  initialAvatarType,
  initialAccessories,
  initialBackground,
  initialBackgroundColor,
}: AvatarCustomizerWrapperProps) {
  const handleSave = async (data: {
    avatarType: string
    accessories: string[]
    background: string
    backgroundColor: string | null
  }) => {
    console.log("[v0] Client: Calling updateAvatar server action")
    const result = await updateAvatar(data)
    console.log("[v0] Client: Server action result:", result)
    return result
  }

  return (
    <AvatarCustomizer
      initialAvatarType={initialAvatarType}
      initialAccessories={initialAccessories}
      initialBackground={initialBackground}
      initialBackgroundColor={initialBackgroundColor}
      onSave={handleSave}
    />
  )
}
