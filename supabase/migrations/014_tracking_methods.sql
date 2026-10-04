-- Add tracking_methods column to users so import preferences persist across sessions
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tracking_methods TEXT[] DEFAULT '{}';
