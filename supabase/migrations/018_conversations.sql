-- ── SPAL Chat Conversations ────────────────────────────────────────────────
-- One row per conversation session between a user and SPAL AI.

CREATE TABLE IF NOT EXISTS public.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT,                        -- auto-set from first user message; user can rename
  messages   JSONB NOT NULL DEFAULT '[]', -- [{role,content,timestamp}]
  duration   INTEGER DEFAULT 0,           -- seconds the session lasted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_owner" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON public.conversations(user_id, updated_at DESC);
