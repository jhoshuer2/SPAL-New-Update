-- ============================================================
-- SPAL Migration 003 — Token API support for phone_otps
-- Run in Supabase SQL Editor after 002_phone_otps.sql
-- ============================================================

-- Make otp_hash nullable (dev mode still uses hash; Termii Token API uses pin_id)
ALTER TABLE public.phone_otps
  ALTER COLUMN otp_hash SET DEFAULT '',
  ALTER COLUMN otp_hash DROP NOT NULL;

-- Add Termii Token API pin_id column
ALTER TABLE public.phone_otps
  ADD COLUMN IF NOT EXISTS termii_pin_id TEXT;
