import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  console.log("[v0] ===== SUPABASE DEBUG CHECK =====")

  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "✓ Set (length: " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ")"
        : "✗ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "✓ Set (length: " + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ")"
        : "✗ Missing",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
    },
    tests: {} as any,
  }

  // Test 1: Basic connection with ANON_KEY
  try {
    console.log("[v0] Test 1: Testing ANON_KEY connection...")
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data, error } = await anonClient.from("profiles").select("count").limit(1)

    results.tests.anonConnection = {
      success: !error,
      error: error?.message,
      data: data,
    }
    console.log("[v0] Test 1 result:", !error ? "✓ Success" : "✗ Failed - " + error.message)
  } catch (error) {
    results.tests.anonConnection = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
    console.error("[v0] Test 1 error:", error)
  }

  // Test 2: Service role connection
  try {
    console.log("[v0] Test 2: Testing SERVICE_ROLE_KEY connection...")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await serviceClient.from("activation_tokens").select("count").limit(1)

    results.tests.serviceRoleConnection = {
      success: !error,
      error: error?.message,
      data: data,
    }
    console.log("[v0] Test 2 result:", !error ? "✓ Success" : "✗ Failed - " + error.message)
  } catch (error) {
    results.tests.serviceRoleConnection = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
    console.error("[v0] Test 2 error:", error)
  }

  // Test 3: Check activation_tokens table structure
  try {
    console.log("[v0] Test 3: Checking activation_tokens table...")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await serviceClient.from("activation_tokens").select("*").limit(1)

    results.tests.activationTokensTable = {
      success: !error,
      error: error?.message,
      hasData: data && data.length > 0,
      sampleColumns: data && data.length > 0 ? Object.keys(data[0]) : [],
    }
    console.log("[v0] Test 3 result:", !error ? "✓ Success" : "✗ Failed - " + error.message)
  } catch (error) {
    results.tests.activationTokensTable = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
    console.error("[v0] Test 3 error:", error)
  }

  // Test 4: Simulate exchangeCodeForSession (without actual code)
  try {
    console.log("[v0] Test 4: Testing auth client initialization...")
    const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Just check if the auth object is available
    results.tests.authClientInit = {
      success: !!authClient.auth,
      hasExchangeMethod: typeof authClient.auth.exchangeCodeForSession === "function",
    }
    console.log("[v0] Test 4 result: ✓ Auth client initialized")
  } catch (error) {
    results.tests.authClientInit = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
    console.error("[v0] Test 4 error:", error)
  }

  console.log("[v0] ===== DEBUG CHECK COMPLETE =====")
  console.log("[v0] Results:", JSON.stringify(results, null, 2))

  return NextResponse.json(results, { status: 200 })
}
