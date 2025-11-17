export async function updateStreak() {
  try {
    const response = await fetch("/api/streak", {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error("Failed to update streak")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Error updating streak:", error)
    return null
  }
}
