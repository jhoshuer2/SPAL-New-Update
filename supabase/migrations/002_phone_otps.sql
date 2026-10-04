-- ============================================================
-- SPAL Migration 002 — Custom Phone OTP table
-- Run in Supabase SQL Editor after 001_initial.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.phone_otps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,          -- SHA-256 hash of the OTP
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS phone_otps_phone_idx ON public.phone_otps(phone);

-- Auto-delete expired OTPs (runs on insert)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.phone_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_otp_insert
  AFTER INSERT ON public.phone_otps
  FOR EACH STATEMENT EXECUTE FUNCTION cleanup_expired_otps();

-- No RLS on this table — managed entirely server-side via service role
