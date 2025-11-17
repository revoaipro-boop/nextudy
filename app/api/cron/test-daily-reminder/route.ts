import { NextResponse } from "next/server"

// Test endpoint to manually trigger daily reminder (for testing without waiting for cron)
export async function GET() {
  try {
    // Call the actual cron endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/daily-reminder`, {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })

    const data = await response.json()

    return NextResponse.json({
      message: "Test daily reminder triggered",
      result: data,
    })
  } catch (error) {
    console.error("[v0] Error testing daily reminder:", error)
    return NextResponse.json(
      {
        error: "Failed to test daily reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
