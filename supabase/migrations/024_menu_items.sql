-- ── Menu items (restaurants and bars) ───────────────────────────────────────
-- The perishable dashboard sells from a menu (dishes and drinks), separate from
-- Ingredients (inventory_items). `quantity` is how many are available to sell and
-- `sold` counts orders against it, which powers the "24/100 plates sold" bar.
-- The app degrades gracefully (empty menu) until this runs.

CREATE TABLE IF NOT EXISTS public.menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id),
  name        TEXT NOT NULL,
  menu_type   TEXT NOT NULL DEFAULT 'food' CHECK (menu_type IN ('food','drinks')),
  category    TEXT,
  unit        TEXT NOT NULL DEFAULT 'plates',
  quantity    NUMERIC NOT NULL DEFAULT 0,
  sold        NUMERIC NOT NULL DEFAULT 0,
  price       NUMERIC NOT NULL DEFAULT 0,
  image_url   TEXT,
  images      TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'menu_items_owner'
  ) THEN
    CREATE POLICY "menu_items_owner" ON public.menu_items
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_menu_items_user ON public.menu_items(user_id, created_at);
