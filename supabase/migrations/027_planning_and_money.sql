-- 027 · Planning studio (E) and money capture extras (F). ADDITIVE ONLY; down path: supabase/down/027_down.sql.
-- Legacy `records` stays as it is (numeric naira). New columns are nullable/defaulted so nothing existing changes.
-- New tables store money as integer kobo (spec §7). The API converts naira <-> kobo at the boundary.

-- ── records: payment method, due date, offline idempotency, personal flag ─────
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash','transfer','pos','credit')),
  ADD COLUMN IF NOT EXISTS due_on date,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS records_client_id_key ON public.records (client_id) WHERE client_id IS NOT NULL;

-- ── businesses: identity fields for F16 ──────────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS cac_number text,
  ADD COLUMN IF NOT EXISTS tin text,
  ADD COLUMN IF NOT EXISTS bank_display text,
  ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}';

-- ── Debts & credit (F13) ─────────────────────────────────────────────────────
-- "Owed to me" = sale records with payment_status 'owing'; part payments are recorded here.
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_id uuid NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS debt_payments_record_idx ON public.debt_payments(record_id);

-- "I owe": money the owner owes suppliers and others.
CREATE TABLE IF NOT EXISTS public.payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  counterparty_name text NOT NULL,
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  paid_kobo bigint NOT NULL DEFAULT 0 CHECK (paid_kobo >= 0),
  due_on date,
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payables_user_idx ON public.payables(user_id) WHERE deleted_at IS NULL;

-- ── Planning studio (E02–E06): one plan per user for now ─────────────────────
CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  raw_text text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}',        -- {oneLiner, customer, offer, why}
  questions jsonb NOT NULL DEFAULT '[]',      -- Spal's clarifying questions
  alternatives jsonb NOT NULL DEFAULT '[]',   -- other angles explored
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  checklist jsonb NOT NULL DEFAULT '{}',              -- {competitors:{done,note}, price:{done,note}, pilot:{done,note}}
  customer_conversations jsonb NOT NULL DEFAULT '[]', -- [{name, date, said}]
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',                  -- [{id, name, cost_kobo, have}]
  available_kobo bigint NOT NULL DEFAULT 0 CHECK (available_kobo >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.launch_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  weeks jsonb NOT NULL DEFAULT '[]',                  -- [{n, title, tasks:[{id, text, done, remind_on?}]}]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── updated_at triggers (function from 026) ──────────────────────────────────
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['payables','ideas','validations','budgets','launch_plans'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- ── Row Level Security: private business data is owner-only (spec §7.10) ─────
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['debt_payments','payables','ideas','validations','budgets','launch_plans'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_owner_all', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t || '_owner_all', t);
  END LOOP;
END $$;
-- A debt payment may only attach to the owner's own record.
DROP POLICY IF EXISTS debt_payments_owner_all ON public.debt_payments;
CREATE POLICY debt_payments_owner_all ON public.debt_payments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.records r WHERE r.id = record_id AND r.user_id = auth.uid()));
