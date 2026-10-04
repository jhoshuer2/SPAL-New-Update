-- Access-rule tests for 026 (spec §7.10). Run on STAGING only, as the postgres role:
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/access_rules.sql
-- Creates two users, then proves user B cannot read or write user A's private rows. Rolls back at the end.
BEGIN;
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b@test.local');
INSERT INTO public.users (id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001'),('bbbbbbbb-0000-0000-0000-000000000002');
INSERT INTO public.moments (user_id, type, text) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','win','A private win');
INSERT INTO public.spal_memory (user_id, fact, category, source) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','Sells jollof','business','onboarding');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}',true);

DO $$ DECLARE n int; t text; BEGIN
  FOREACH t IN ARRAY ARRAY['moments','spal_memory','checkins','user_milestones','level_history','onboarding_responses','ai_usage'] LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = %L', t, 'aaaaaaaa-0000-0000-0000-000000000001') INTO n;
    IF n <> 0 THEN RAISE EXCEPTION 'LEAK: user B read % rows of A in %', n, t; END IF;
  END LOOP;
  BEGIN
    INSERT INTO public.moments (user_id, type) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','win');
    RAISE EXCEPTION 'LEAK: user B inserted a moment as A';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.ai_usage (user_id, function) VALUES ('bbbbbbbb-0000-0000-0000-000000000002','x');
    RAISE EXCEPTION 'ai_usage must be server-write only';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
  IF (SELECT count(*) FROM public.milestones) <> 24 THEN RAISE EXCEPTION 'milestone catalogue should have 24 rows'; END IF;
END $$;
ROLLBACK;
SELECT 'access rules OK' AS result;
