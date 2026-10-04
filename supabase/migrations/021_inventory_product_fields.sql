-- ── Inventory product fields: rich catalog for the Sell + Stock flows ───────
-- Adds the fields captured by the "Add an Inventory" form so products can carry
-- a photo, category, SKU/GTIN, discount and variations, and so the catalog can
-- show a real "X sold" progress bar (sold = initial_stock - quantity).
-- The API reads/writes these defensively (unknown columns are stripped and the
-- insert retried) so nothing breaks before this migration runs.

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS category          TEXT,
  ADD COLUMN IF NOT EXISTS image_url         TEXT,
  ADD COLUMN IF NOT EXISTS images            JSONB,
  ADD COLUMN IF NOT EXISTS initial_stock     NUMERIC,
  ADD COLUMN IF NOT EXISTS sku               TEXT,
  ADD COLUMN IF NOT EXISTS gtin              TEXT,
  ADD COLUMN IF NOT EXISTS discount          NUMERIC,
  ADD COLUMN IF NOT EXISTS discount_eligible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS variations        JSONB;

-- Backfill a baseline for existing products so their sold-progress reads sensibly.
UPDATE public.inventory_items
  SET initial_stock = quantity
  WHERE initial_stock IS NULL;

-- ── Storage bucket for product images ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('inventory', 'inventory', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read of product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'inventory_public_read'
  ) THEN
    CREATE POLICY "inventory_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'inventory');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'inventory_owner_write'
  ) THEN
    CREATE POLICY "inventory_owner_write" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'inventory' AND auth.uid() = owner);
  END IF;
END $$;
