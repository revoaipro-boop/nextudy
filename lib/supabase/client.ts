import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl =
  typeof window !== "undefined"
    ? (window as any).__NEXT_DATA__?.props?.pageProps?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey =
  typeof window !== "undefined"
    ? (window as any).__NEXT_DATA__?.props?.pageProps?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables not available in client")
    console.error("[v0] This is expected in v0 preview - Supabase features will not work")

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signInWithOAuth: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signUp: async () => ({ data: null, error: new Error("Supabase not configured") }),
        onAuthStateChange: (callback: any) => {
          // Return a subscription object with unsubscribe method
          return {
            data: {
              subscription: {
                unsubscribe: () => {},
              },
            },
          }
        },
      },
      from: () => ({
        select: () => ({ data: null, error: new Error("Supabase not configured") }),
        insert: () => ({ data: null, error: new Error("Supabase not configured") }),
        update: () => ({ data: null, error: new Error("Supabase not configured") }),
        delete: () => ({ data: null, error: new Error("Supabase not configured") }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
