-- ── Restaurant table count ──────────────────────────────────────────────────
-- How many tables a restaurant has, so "Table" orders can pick which table is
-- being served. The app degrades gracefully: the profile API strips the column
-- and retries if this migration hasn't been applied yet.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS table_count INTEGER;
