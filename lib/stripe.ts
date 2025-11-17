import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_PRODUCTS = {
  MONTHLY: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
    name: 'Nextudy Premium Monthly',
    price: 9.99,
    currency: 'eur',
    interval: 'month',
  },
  ANNUAL: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || '',
    name: 'Nextudy Premium Annual',
    price: 99.99,
    currency: 'eur',
    interval: 'year',
  },
} as const

export type SubscriptionPlan = 'monthly' | 'annual'

export async function createStripeCustomer(userId: string, email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  })
  return customer
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  })

  return session
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

export async function cancelSubscription(subscriptionId: string, immediately = false) {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId)
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
}

export async function resumeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}
