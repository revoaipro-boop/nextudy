import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        verification_status: 'approved',
        is_verified: true,
      })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    const { error: tokenError } = await adminClient
      .from('activation_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (tokenError) {
      console.error('[v0] Token update error:', tokenError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Approve user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
