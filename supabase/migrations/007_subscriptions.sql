-- ============================================================
-- Migration 007 — Subscriptions (Paystack / Paywall)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Denormalised plan field on users for fast per-request checks
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

-- Full subscription record (Paystack metadata lives here)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                      TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  billing_cycle             TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  paystack_customer_code    TEXT,
  paystack_subscription_code TEXT,
  paystack_email_token      TEXT,
  current_period_end        TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions(user_id);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_owner" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Trigger: keep users.subscription_plan in sync when subscriptions row changes
CREATE OR REPLACE FUNCTION sync_subscription_plan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET subscription_plan = CASE
    WHEN NEW.plan = 'pro' AND NEW.status = 'active' AND
         (NEW.current_period_end IS NULL OR NEW.current_period_end > NOW())
    THEN 'pro'
    ELSE 'free'
  END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_plan();
