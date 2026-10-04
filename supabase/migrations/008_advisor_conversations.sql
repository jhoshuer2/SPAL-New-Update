-- ============================================================
-- Migration 008 — Advisor Conversations (AI Financial Advisors)
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.advisor_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advisor_id  TEXT NOT NULL,   -- 'ade' | 'chioma' | 'emeka' | 'fatima'
  messages    JSONB NOT NULL DEFAULT '[]',
  title       TEXT,            -- first 60 chars of user's opening message
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS advisor_conv_user_idx
  ON public.advisor_conversations(user_id, advisor_id, updated_at DESC);

-- RLS
ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advisor_conv_owner" ON public.advisor_conversations
  FOR ALL USING (auth.uid() = user_id);
