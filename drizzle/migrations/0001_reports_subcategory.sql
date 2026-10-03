ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.reports ADD CONSTRAINT reports_subcategory_len CHECK (subcategory IS NULL OR char_length(subcategory) <= 80);