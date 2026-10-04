-- ── Inventory restructure: selling price + activity history ─────────────────
-- Adds a selling price to products and an activity log (added / sold /
-- restocked) so SPAL can show inventory value, product history, and insights.
-- The app reads defensively (selling_price falls back to cost_price; a missing
-- activity table is treated as empty history) so nothing breaks before this runs.

-- 1. Selling price on each product
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC;

-- 2. Activity log
CREATE TABLE IF NOT EXISTS public.inventory_activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id),
  item_id     UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('added','sold','restocked')),
  qty_change  NUMERIC NOT NULL,        -- positive for added/restocked, negative for sold
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_activity ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_activity' AND policyname = 'inventory_activity_owner'
  ) THEN
    CREATE POLICY "inventory_activity_owner" ON public.inventory_activity
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_activity_item
  ON public.inventory_activity(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_activity_user
  ON public.inventory_activity(user_id, created_at DESC);
