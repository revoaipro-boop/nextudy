-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'free' CHECK (role IN ('free', 'premium', 'admin'));
  END IF;
END $$;

-- Add subscription_status column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive' 
      CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'past_due'));
  END IF;
END $$;

-- Create subscriptions table for Stripe integration
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')) DEFAULT 'inactive',
  plan_type TEXT CHECK (plan_type IN ('monthly', 'annual')) DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Create function to update profile when subscription changes
CREATE OR REPLACE FUNCTION update_profile_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile subscription_status and role based on subscription
  UPDATE profiles
  SET 
    subscription_status = CASE 
      WHEN NEW.status IN ('active', 'trialing') THEN 'active'
      WHEN NEW.status = 'past_due' THEN 'past_due'
      WHEN NEW.status IN ('canceled', 'unpaid', 'incomplete_expired') THEN 'cancelled'
      ELSE 'inactive'
    END,
    role = CASE 
      WHEN NEW.status IN ('active', 'trialing') AND role != 'admin' THEN 'premium'
      WHEN NEW.status NOT IN ('active', 'trialing') AND role = 'premium' THEN 'free'
      ELSE role
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_from_subscription();

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription data for users';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
