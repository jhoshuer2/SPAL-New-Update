-- Add customer credit/debt tracking to records
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('paid', 'owing')),
  ADD COLUMN IF NOT EXISTS customer_name TEXT;
