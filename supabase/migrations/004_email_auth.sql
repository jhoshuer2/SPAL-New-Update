-- ============================================================
-- SPAL Migration 004 — Email auth support
-- Run in Supabase SQL Editor
-- ============================================================

-- Phone number is now optional (email users won't have one)
ALTER TABLE public.users
  ALTER COLUMN phone_number DROP NOT NULL;

-- Store email for email-authenticated users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Unique index on email (NULL rows excluded — phone users stay unique by phone)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx
  ON public.users(email)
  WHERE email IS NOT NULL;
