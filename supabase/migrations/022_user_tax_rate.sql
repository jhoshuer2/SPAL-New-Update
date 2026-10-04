-- ── User tax rate (VAT) ─────────────────────────────────────────────────────
-- Lets each user set the tax percentage applied to sales at checkout.
-- The app reads it defensively (falls back to 7.5) and the profile API strips
-- the column and retries if this migration hasn't been applied yet.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 7.5;
