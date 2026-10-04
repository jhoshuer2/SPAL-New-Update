-- ============================================================
-- SPAL Database Schema — Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number          TEXT UNIQUE NOT NULL,
  full_name             TEXT,
  business_name         TEXT,
  business_type         TEXT CHECK (business_type IN (
                          'food_seller','bar_owner','fashion_vendor',
                          'salon','kiosk','market_trader','other'
                        )),
  business_goals        TEXT[] DEFAULT '{}',
  currency              TEXT DEFAULT 'NGN',
  whatsapp_number       TEXT,
  streak_days           INTEGER DEFAULT 0,
  last_active           DATE,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECORDS (sales + expenses)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('sale', 'expense')),
  amount        DECIMAL(12, 2) NOT NULL,
  description   TEXT,
  category      TEXT,
  input_method  TEXT CHECK (input_method IN ('voice', 'text', 'quick')),
  raw_input     TEXT,
  record_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS records_user_id_idx    ON public.records(user_id);
CREATE INDEX IF NOT EXISTS records_date_idx       ON public.records(record_date);
CREATE INDEX IF NOT EXISTS records_user_date_idx  ON public.records(user_id, record_date);

-- ============================================================
-- DAILY SUMMARIES (AI-generated, cached per user per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  summary_date     DATE NOT NULL,
  total_sales      DECIMAL(12, 2) DEFAULT 0,
  total_expenses   DECIMAL(12, 2) DEFAULT 0,
  profit           DECIMAL(12, 2) DEFAULT 0,
  ai_insight       TEXT,
  ai_message       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,
  week_end         DATE NOT NULL,
  total_sales      DECIMAL(12, 2) DEFAULT 0,
  total_expenses   DECIMAL(12, 2) DEFAULT 0,
  profit           DECIMAL(12, 2) DEFAULT 0,
  top_insight      TEXT,
  report_data      JSONB DEFAULT '{}',
  sent_via         TEXT[] DEFAULT '{}',
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CONVERSATIONS (Ask SPAL)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations   ENABLE ROW LEVEL SECURITY;

-- Users: can only see/edit their own row
CREATE POLICY "users_self" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Records: user owns their records
CREATE POLICY "records_owner" ON public.records
  FOR ALL USING (auth.uid() = user_id);

-- Daily summaries: user owns their summaries
CREATE POLICY "summaries_owner" ON public.daily_summaries
  FOR ALL USING (auth.uid() = user_id);

-- Weekly reports: user owns their reports
CREATE POLICY "reports_owner" ON public.weekly_reports
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: user owns their conversations
CREATE POLICY "conversations_owner" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE streak_days trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    last_active = CURRENT_DATE,
    streak_days = CASE
      WHEN last_active = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
      WHEN last_active = CURRENT_DATE THEN streak_days
      ELSE 1
    END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_record_insert
  AFTER INSERT ON public.records
  FOR EACH ROW EXECUTE FUNCTION update_streak();

-- ============================================================
-- Done! All tables created.
-- ============================================================
