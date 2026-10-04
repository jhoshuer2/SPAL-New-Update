-- Down path for 027. Staging, or production with explicit sign-off: it deletes planning data, payables and debt payments.
DROP TABLE IF EXISTS public.launch_plans, public.budgets, public.validations, public.ideas, public.payables, public.debt_payments CASCADE;
DROP INDEX IF EXISTS public.records_client_id_key;
ALTER TABLE public.records DROP COLUMN IF EXISTS payment_method, DROP COLUMN IF EXISTS due_on, DROP COLUMN IF EXISTS client_id, DROP COLUMN IF EXISTS is_personal;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS logo_url, DROP COLUMN IF EXISTS address, DROP COLUMN IF EXISTS cac_number, DROP COLUMN IF EXISTS tin, DROP COLUMN IF EXISTS bank_display, DROP COLUMN IF EXISTS socials;
