-- Migration 009: User Goals Tracking
-- Stores each user's financial targets; progress is computed live from records.

CREATE TABLE IF NOT EXISTS public.user_goals (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type    TEXT         NOT NULL CHECK (goal_type IN (
                               'daily_sales',
                               'weekly_profit',
                               'monthly_sales',
                               'yearly_revenue'
                             )),
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, goal_type)
);

-- One row per user per goal type — only one active target at a time.

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own goals"
  ON public.user_goals
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_goals_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_goals_updated_at();
