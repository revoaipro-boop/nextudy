import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, STRIPE_PRODUCTS } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()
    
    if (!plan || (plan !== 'monthly' && plan !== 'annual')) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = plan === 'monthly' 
      ? STRIPE_PRODUCTS.MONTHLY.priceId 
      : STRIPE_PRODUCTS.ANNUAL.priceId

    if (!priceId) {
      return NextResponse.json({ 
        error: 'Stripe price ID not configured' 
      }, { status: 500 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const session = await createCheckoutSession(
      user.id,
      user.email!,
      priceId,
      `${origin}/dashboard/subscription?success=true`,
      `${origin}/pricing?canceled=true`,
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('[v0] Create checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
