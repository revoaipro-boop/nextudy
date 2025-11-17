"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateAvatar(data: {
  avatarType: string
  accessories: string[]
  background: string
  backgroundColor: string | null
}) {
  console.log("[v0] Server action: updateAvatar called with data:", data)

  const supabase = await createClient()

  // Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("[v0] Auth check - User:", user?.id, "Error:", authError)

  if (authError || !user) {
    console.error("[v0] Authentication failed:", authError)
    throw new Error("Vous devez être connecté pour modifier votre avatar")
  }

  console.log("[v0] Updating profile for user:", user.id)

  // Update the profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_type: data.avatarType,
      avatar_accessories: data.accessories,
      avatar_background: data.background,
      avatar_background_color: data.backgroundColor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("[v0] Profile update error:", updateError)
    throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
  }

  console.log("[v0] Avatar updated successfully")

  // Revalidate the profile page to show updated avatar
  revalidatePath("/profile")

  return { success: true }
}
