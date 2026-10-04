-- 026 · Levels, journey, onboarding and Spal memory (spec §7.2, §7.6). ADDITIVE ONLY.
-- Live DB holds real users: nothing is dropped or rewritten. Down path: supabase/down/026_down.sql.
-- Existing tables are `users` (profile) and `businesses`; new tables reference those.
-- Money stays out of this migration; the kobo conversion of `records` is a separate, signed-off migration.

-- ── users: level + onboarding columns ───────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','pcm')),
  ADD COLUMN IF NOT EXISTS current_level smallint NOT NULL DEFAULT 0 CHECK (current_level BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS hard_season boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_frequency text NOT NULL DEFAULT 'few_weekly' CHECK (checkin_frequency IN ('daily','few_weekly','weekly')),
  ADD COLUMN IF NOT EXISTS checkin_time time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS memory_paused boolean NOT NULL DEFAULT false;

-- Existing users keep their legacy `onboarding_completed` flag. `onboarding_completed_at` stays NULL for them so they
-- are offered the new level placement (B04-B08) once, without being forced through the full flow again.

-- ── shared trigger ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ── onboarding_responses ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  computed_level smallint CHECK (computed_level BETWEEN 0 AND 5),
  confidence numeric(3,2) CHECK (confidence BETWEEN 0 AND 1),
  signals jsonb NOT NULL DEFAULT '[]',
  chosen_level smallint CHECK (chosen_level BETWEEN 0 AND 5),
  begin_choice text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── level_history ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.level_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  from_level smallint CHECK (from_level BETWEEN 0 AND 5),
  to_level smallint NOT NULL CHECK (to_level BETWEEN 0 AND 5),
  reason text NOT NULL CHECK (reason IN ('placement','adjusted','milestones','manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── milestones (seeded catalogue, read-only to clients) ─────────────────────
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  level smallint NOT NULL CHECK (level BETWEEN 0 AND 5),
  position smallint NOT NULL,
  title text NOT NULL,
  description text,
  completion_type text NOT NULL CHECK (completion_type IN ('manual','data','spal','none')),
  data_rule jsonb,
  is_gateway boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level, position)
);

-- ── user_milestones ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','in_progress','done')),
  completed_at timestamptz,
  proof_url text,
  proof_note text,
  completed_by text CHECK (completed_by IN ('user','data','spal','placement')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_id) -- per user for now; per-business scoping arrives with multiple businesses (F17)
);

-- ── moments (private journey entries) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'manual' CHECK (kind IN ('auto','manual')),
  type text NOT NULL CHECK (type IN ('day_one','win','struggle','lesson','decision','first_sale','registered','first_hire','level_up','milestone')),
  text text,
  media_urls text[] NOT NULL DEFAULT '{}',
  voice_url text,
  occurred_on date NOT NULL DEFAULT current_date,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Spal: memory, check-ins, usage ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spal_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  fact text NOT NULL,
  category text NOT NULL CHECK (category IN ('person','business','goal','struggle','preference','history')),
  source text NOT NULL CHECK (source IN ('onboarding','checkin','chat','records','moment')),
  source_ref text,
  confidence numeric(3,2) NOT NULL DEFAULT 0.7 CHECK (confidence BETWEEN 0 AND 1),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  context text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  answer text,
  answer_type text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  function text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS level_history_user_idx ON public.level_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_milestones_user_idx ON public.user_milestones(user_id);
CREATE INDEX IF NOT EXISTS moments_user_idx ON public.moments(user_id, occurred_on DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS spal_memory_user_idx ON public.spal_memory(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS checkins_user_idx ON public.checkins(user_id, scheduled_for DESC);
-- One check-in per user per (UTC) day, so opening it twice at once can never create two.
CREATE UNIQUE INDEX IF NOT EXISTS checkins_one_per_day ON public.checkins (user_id, ((scheduled_for AT TIME ZONE 'UTC')::date));
CREATE INDEX IF NOT EXISTS ai_usage_user_day_idx ON public.ai_usage(user_id, created_at DESC);

-- ── updated_at triggers ─────────────────────────────────────────────────────
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['onboarding_responses','user_milestones','moments','spal_memory'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- ── Row Level Security (spec §7.10) ─────────────────────────────────────────
-- Owner-only on every private table. Clients can never read another user's rows.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['onboarding_responses','level_history','user_milestones','moments','spal_memory','checkins','ai_usage'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_owner_all', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t || '_owner_all', t);
  END LOOP;
END $$;

-- ai_usage is written by the server only: clients may read their own rows, not write.
DROP POLICY IF EXISTS ai_usage_owner_all ON public.ai_usage;
DROP POLICY IF EXISTS ai_usage_owner_read ON public.ai_usage;
CREATE POLICY ai_usage_owner_read ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS milestones_read ON public.milestones;
CREATE POLICY milestones_read ON public.milestones FOR SELECT USING (auth.role() = 'authenticated');

-- ── milestone catalogue seed (Appendix A) ───────────────────────────────────
INSERT INTO public.milestones (key, level, position, title, completion_type, data_rule, is_gateway) VALUES
 ('l0_describe_idea',0,1,'Describe your idea in one sentence','manual',NULL,false),
 ('l0_talk_to_customers',0,2,'Talk to 5 potential customers','spal',NULL,false),
 ('l0_startup_budget',0,3,'Set your startup budget','manual',NULL,false),
 ('l0_first_sale',0,4,'Make your first sale','data','{"rule":"first_sale"}',true),
 ('l1_records_30_days',1,1,'Record sales for 30 days','data','{"rule":"records_30_days"}',false),
 ('l1_profit_per_product',1,2,'Know your profit on each product','data','{"rule":"profit_per_product"}',false),
 ('l1_separate_money',1,3,'Separate business and personal money','manual',NULL,false),
 ('l1_register_business',1,4,'Register your business name','manual',NULL,true),
 ('l2_records_3_months',2,1,'Keep 3 months of complete records','data','{"rule":"records_3_months"}',false),
 ('l2_get_tin',2,2,'Get your TIN','manual',NULL,false),
 ('l2_monthly_profit_goal',2,3,'Hit a monthly profit goal','data','{"rule":"monthly_profit_goal"}',false),
 ('l2_first_hire',2,4,'Hire your first person','data','{"rule":"first_hire"}',true),
 ('l3_write_roles',3,1,'Write down every role','manual',NULL,false),
 ('l3_salaries_on_time',3,2,'Pay salaries on time 3 months running','data','{"rule":"salaries_on_time_3"}',false),
 ('l3_meeting_summary',3,3,'Run a meeting with a Spal summary','data','{"rule":"meeting_summary_exists"}',false),
 ('l3_second_location',3,4,'Open a second location, channel or product line','manual',NULL,true),
 ('l4_document_processes',4,1,'Document your key processes','manual',NULL,false),
 ('l4_cash_flow_forecast',4,2,'Build a 6-month cash flow forecast','manual',NULL,false),
 ('l4_funding_pack',4,3,'Prepare a funding-ready pack','manual',NULL,false),
 ('l4_management_team',4,4,'Run as a company with a management team','manual',NULL,true),
 ('l5_mentor_someone',5,1,'Mentor someone at Levels 0–2','manual',NULL,false),
 ('l5_year_review',5,2,'Publish your year in review','data','{"rule":"year_review_published"}',false),
 ('l5_new_venture',5,3,'Start or acquire another venture','manual',NULL,false),
 ('l5_seasons',5,4,'The journey continues in seasons','none',NULL,true)
ON CONFLICT (key) DO NOTHING;
