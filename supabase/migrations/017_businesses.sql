-- ── Multi-Business Support ────────────────────────────────────────────────────
-- Allows one user to have multiple businesses, each with isolated data.

-- 1. New businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name    TEXT NOT NULL,
  business_type    TEXT NOT NULL CHECK (business_type IN (
    'food_seller','bar_owner','fashion_vendor','salon','kiosk','market_trader','other'
  )),
  currency         TEXT NOT NULL DEFAULT 'NGN',
  tracking_methods TEXT[] DEFAULT '{}',
  business_goals   TEXT[] DEFAULT '{}',
  is_archived      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own businesses"
  ON public.businesses FOR ALL
  USING (auth.uid() = user_id);

-- 2. Migrate existing users → one business row per user from their current profile
INSERT INTO public.businesses (user_id, business_name, business_type, currency, tracking_methods, business_goals)
SELECT
  u.id,
  COALESCE(u.business_name, 'My Business'),
  COALESCE(u.business_type, 'other'),
  COALESCE(u.currency, 'NGN'),
  '{}',
  '{}'
FROM public.users u
ON CONFLICT DO NOTHING;

-- 3. Add active_business_id to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS active_business_id UUID REFERENCES public.businesses(id);

-- Point each user at their migrated business
UPDATE public.users u
SET active_business_id = b.id
FROM public.businesses b
WHERE b.user_id = u.id AND u.active_business_id IS NULL;

-- 4. Add business_id FK to core data tables (nullable — backfilled below)
-- records always exists
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id);

-- daily_summaries, user_goals, inventory_items may not exist yet — guard with DO blocks
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_summaries') THEN
    ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_goals') THEN
    ALTER TABLE public.user_goals ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id);
  END IF;
END $$;

-- 5. Backfill business_id on all existing rows using each user's only business
UPDATE public.records r
SET business_id = b.id
FROM public.businesses b
WHERE b.user_id = r.user_id AND r.business_id IS NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_summaries') THEN
    UPDATE public.daily_summaries d SET business_id = b.id FROM public.businesses b WHERE b.user_id = d.user_id AND d.business_id IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_goals') THEN
    UPDATE public.user_goals ug SET business_id = b.id FROM public.businesses b WHERE b.user_id = ug.user_id AND ug.business_id IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    UPDATE public.inventory_items i SET business_id = b.id FROM public.businesses b WHERE b.user_id = i.user_id AND i.business_id IS NULL;
  END IF;
END $$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_user_id  ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_records_business_id ON public.records(business_id);
CREATE INDEX IF NOT EXISTS idx_goals_business_id   ON public.user_goals(business_id);
