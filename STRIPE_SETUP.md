# Stripe Subscription Setup Guide

Complete guide to set up Stripe subscriptions for Nextudy.

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Switch to "Test mode" (toggle in top right)

## Step 2: Create Products and Prices

### Create Monthly Product

1. Go to Products → Add Product
2. Name: "Nextudy Premium Monthly"
3. Description: "Monthly subscription to Nextudy Premium"
4. Pricing:
   - One time or recurring: **Recurring**
   - Price: **9.99 EUR**
   - Billing period: **Monthly**
5. Click "Save product"
6. Copy the **Price ID** (starts with `price_...`)
7. Add to environment variables as `STRIPE_MONTHLY_PRICE_ID`

### Create Annual Product

1. Go to Products → Add Product
2. Name: "Nextudy Premium Annual"
3. Description: "Annual subscription to Nextudy Premium"
4. Pricing:
   - One time or recurring: **Recurring**
   - Price: **99.99 EUR**
   - Billing period: **Yearly**
5. Click "Save product"
6. Copy the **Price ID** (starts with `price_...`)
7. Add to environment variables as `STRIPE_ANNUAL_PRICE_ID`

## Step 3: Get API Keys

1. Go to Developers → API keys
2. Copy **Publishable key** (starts with `pk_test_...`)
   - Already set as `STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** (starts with `sk_test_...`)
   - Already set as `STRIPE_SECRET_KEY`

## Step 4: Configure Webhooks

1. Go to Developers → Webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://nextudy.fr/api/stripe/webhook`
4. Description: "Nextudy subscription webhooks"
5. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_...`)
8. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

### For Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret from the output

## Step 5: Environment Variables

Add these to your Vercel project:

\`\`\`env
# Stripe API Keys (already set)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Product Price IDs (NEW - add these)
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...

# Stripe Webhook Secret (NEW - add this)
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

## Step 6: Run Database Migration

Execute the subscription system migration:

\`\`\`bash
# Run: scripts/014_add_subscription_system.sql
\`\`\`

This creates:
- `subscriptions` table
- Role and subscription_status columns in profiles
- Trigger to auto-update profiles when subscription changes

## Step 7: Test the Integration

### Test Checkout Flow

1. Go to `/pricing` on your site
2. Click "Passer à Premium"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date
5. Any CVV
6. Complete checkout
7. Verify:
   - User redirected to success page
   - Subscription created in `subscriptions` table
   - Profile updated with `subscription_status: 'active'` and `role: 'premium'`

### Test Webhooks

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click on your webhook endpoint
3. Send test events to verify they're received
4. Check your application logs for `[v0]` webhook messages

### Test Billing Portal

1. Log in as a user with active subscription
2. Go to `/dashboard/subscription`
3. Click "Manage Subscription"
4. Verify Stripe billing portal opens
5. Test:
   - Update payment method
   - Cancel subscription
   - View invoices

## Step 8: Switch to Production

When ready to go live:

1. Switch Stripe to **Live mode** (toggle in dashboard)
2. Create products and prices again in live mode
3. Get new API keys (live keys start with `pk_live_` and `sk_live_`)
4. Create new webhook with live endpoint URL
5. Update environment variables with live keys
6. Test thoroughly in production

## Webhook Events Explained

- `checkout.session.completed`: User completed payment → Create subscription record
- `customer.subscription.updated`: Subscription changed (plan upgrade, etc.) → Update subscription
- `customer.subscription.deleted`: User canceled subscription → Update status to canceled
- `invoice.payment_failed`: Payment failed → Mark subscription as past_due
- `invoice.payment_succeeded`: Payment succeeded → Update subscription dates

## Testing Subscription Scenarios

### Test Cards

Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Requires authentication**: `4000 0027 6000 3184`

More test cards: https://stripe.com/docs/testing

### Test Subscription Actions

1. **Create subscription**: Complete checkout with test card
2. **Update subscription**: Use billing portal to change plan
3. **Cancel subscription**: Use billing portal to cancel
4. **Reactivate**: Cancel with "at period end", then reactivate
5. **Payment failure**: Use declining test card for renewal

## Troubleshooting

### Webhook not receiving events

- Verify webhook URL is correct and publicly accessible
- Check webhook signing secret matches environment variable
- Look at webhook logs in Stripe Dashboard
- For local development, use Stripe CLI forwarding

### Subscription not updating profile

- Check trigger function is created: `update_profile_from_subscription`
- Look for errors in Supabase logs
- Verify RLS policies allow service role to update profiles

### Checkout session not creating subscription

- Verify price IDs are correct in environment variables
- Check that price IDs match the products in Stripe dashboard
- Look for errors in `/api/stripe/create-checkout-session` logs

## Security Considerations

- Never expose `STRIPE_SECRET_KEY` in client-side code
- Always verify webhook signatures
- Use HTTPS for production webhook URLs
- Store sensitive data in environment variables
- Regularly rotate API keys
- Monitor Stripe Dashboard for suspicious activity

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)
- [Test Your Integration](https://stripe.com/docs/testing)
\`\`\`
