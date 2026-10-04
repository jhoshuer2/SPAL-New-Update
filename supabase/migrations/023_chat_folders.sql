-- ── Chat folders ────────────────────────────────────────────────────────────
-- Lets users organise Ask SPAL chats into folders and move chats between them.
-- The app reads/writes defensively (folder_id stripped and retried if this
-- migration hasn't run), so nothing breaks beforehand.

CREATE TABLE IF NOT EXISTS public.chat_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_folders' AND policyname = 'chat_folders_owner'
  ) THEN
    CREATE POLICY "chat_folders_owner" ON public.chat_folders FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.chat_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_folder ON public.conversations(folder_id);
