-- Expand input_method allowed values to cover all entry flows
ALTER TABLE public.records
  DROP CONSTRAINT IF EXISTS records_input_method_check;

ALTER TABLE public.records
  ADD CONSTRAINT records_input_method_check
  CHECK (input_method IN ('voice', 'text', 'quick', 'manual', 'picture', 'import'));
