-- ── Backfill conversations schema ──────────────────────────────────────────
-- The `conversations` table predates migration 018, so 018's
-- `CREATE TABLE IF NOT EXISTS` was a no-op and never added the title/duration
-- columns the chat history feature expects. Add them here.
--
-- The app currently derives the title from the first message and treats
-- duration as 0, so it works without these columns — but applying this lets
-- custom renames and session duration persist.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS title    TEXT,
  ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;

-- Backfill titles for existing rows from the first user message.
UPDATE public.conversations
SET title = LEFT(
  (SELECT m->>'content'
   FROM jsonb_array_elements(messages) m
   WHERE m->>'role' = 'user'
   LIMIT 1), 60)
WHERE title IS NULL
  AND jsonb_typeof(messages) = 'array';

-- Ensure RLS + owner policy exist (no-ops if already present).
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_owner'
  ) THEN
    CREATE POLICY "conversations_owner" ON public.conversations
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON public.conversations(user_id, updated_at DESC);
