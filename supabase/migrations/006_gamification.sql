-- ============================================================
-- Migration 006 — Gamification (Badges + Weekly Challenges)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Badge definitions (static catalogue)
CREATE TABLE IF NOT EXISTS public.badges (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL  -- 'streak' | 'records' | 'learn' | 'profit'
);

-- Per-user earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES public.badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx ON public.user_badges(user_id);

-- Weekly challenges (one active per user per week)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,
  challenge_type   TEXT NOT NULL,  -- 'daily_streak' | 'total_records' | 'total_profit_days'
  challenge_label  TEXT NOT NULL,  -- human-readable label shown in UI
  target           INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  completed        BOOLEAN DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS user_challenges_user_idx ON public.user_challenges(user_id, week_start);

-- RLS
ALTER TABLE public.badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Badges are public-read (no user data)
CREATE POLICY "badges_read_all"       ON public.badges        FOR SELECT USING (true);
CREATE POLICY "user_badges_owner"     ON public.user_badges   FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "user_challenges_owner" ON public.user_challenges FOR ALL  USING (auth.uid() = user_id);

-- ── Seed badge catalogue ─────────────────────────────────────────────────────
INSERT INTO public.badges (id, name, emoji, description, category) VALUES
  ('first_step',    'First Step',      '🌱', 'Recorded your very first sale',               'records'),
  ('money_maker',   'Money Maker',     '💰', 'Recorded 10 sales in total',                  'records'),
  ('century',       'Century',         '💯', 'Recorded 100 transactions in total',           'records'),
  ('streak_7',      'Week Warrior',    '🔥', 'Kept a 7-day recording streak',               'streak'),
  ('streak_30',     'Monthly Master',  '🏆', 'Kept a 30-day recording streak',              'streak'),
  ('quick_learner', 'Quick Learner',   '💡', 'Had your first advisor conversation',         'learn'),
  ('goal_setter',   'Goal Setter',     '🎯', 'Set a business goal in your profile',         'records'),
  ('challenge_1',   'Challenge Ace',   '⚡', 'Completed your first weekly challenge',       'records')
ON CONFLICT (id) DO NOTHING;
