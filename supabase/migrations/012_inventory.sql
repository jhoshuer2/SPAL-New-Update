-- ============================================================
-- Inventory items table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  quantity             DECIMAL(10, 3) NOT NULL DEFAULT 0,
  unit                 TEXT NOT NULL DEFAULT 'pieces',
  low_stock_threshold  DECIMAL(10, 3) DEFAULT 5,
  cost_price           DECIMAL(12, 2),   -- per unit, optional
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_user_idx ON public.inventory_items(user_id);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_owner" ON public.inventory_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Inventory preferences on the users table
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS inventory_track_sales BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_setup_done  BOOLEAN DEFAULT false;
