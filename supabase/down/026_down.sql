-- Down path for 026. Only run on staging, or in production with explicit sign-off:
-- it deletes onboarding, journey, memory and check-in data created after 026.
DROP TABLE IF EXISTS public.ai_usage, public.checkins, public.spal_memory, public.moments,
  public.user_milestones, public.milestones, public.level_history, public.onboarding_responses CASCADE;
ALTER TABLE public.users
  DROP COLUMN IF EXISTS display_name, DROP COLUMN IF EXISTS state, DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS age_range, DROP COLUMN IF EXISTS language, DROP COLUMN IF EXISTS current_level,
  DROP COLUMN IF EXISTS hard_season, DROP COLUMN IF EXISTS onboarding_step,
  DROP COLUMN IF EXISTS onboarding_completed_at, DROP COLUMN IF EXISTS checkin_frequency,
  DROP COLUMN IF EXISTS checkin_time, DROP COLUMN IF EXISTS memory_paused;
