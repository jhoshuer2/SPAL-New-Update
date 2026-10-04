-- Access-rule tests for 027. STAGING only: psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/access_rules_027.sql
-- Proves user B cannot read or write user A's planning, payables or debt payments. Rolls back at the end.
BEGIN;
INSERT INTO auth.users (id, email) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','a@test.local'),('bbbbbbbb-0000-0000-0000-000000000002','b@test.local');
INSERT INTO public.users (id) VALUES ('aaaaaaaa-0000-0000-0000-000000000001'),('bbbbbbbb-0000-0000-0000-000000000002');
INSERT INTO public.records (id, user_id, type, amount) VALUES ('11111111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','sale',5000);
INSERT INTO public.ideas (user_id, raw_text) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','A private idea');
INSERT INTO public.budgets (user_id, available_kobo) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 5000000);
INSERT INTO public.payables (user_id, counterparty_name, amount_kobo) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','Supplier',100000);
INSERT INTO public.debt_payments (user_id, record_id, amount_kobo) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',100000);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}',true);
DO $$ DECLARE n int; t text; BEGIN
  FOREACH t IN ARRAY ARRAY['ideas','validations','budgets','launch_plans','payables','debt_payments'] LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = %L', t, 'aaaaaaaa-0000-0000-0000-000000000001') INTO n;
    IF n <> 0 THEN RAISE EXCEPTION 'LEAK: B read % rows of A in %', n, t; END IF;
  END LOOP;
  BEGIN
    INSERT INTO public.debt_payments (user_id, record_id, amount_kobo) VALUES ('bbbbbbbb-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001',1);
    RAISE EXCEPTION 'LEAK: B attached a payment to A''s record';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.payables (user_id, counterparty_name, amount_kobo) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','x',1);
    RAISE EXCEPTION 'LEAK: B inserted a payable as A';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
END $$;
ROLLBACK;
SELECT 'access rules 027 OK' AS result;
