-- In-app notification centre
-- Stores badge unlocks, milestones, app updates, coach events, etc.

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,   -- badge_unlocked | milestone | app_update | streak | coach
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  icon        TEXT,                   -- emoji or icon key
  data        JSONB       DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications on behalf of any user
CREATE POLICY "Service role insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
