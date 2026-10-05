ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS contact_method text,
  ADD COLUMN IF NOT EXISTS contact_safe boolean,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact_outcome text,
  ADD COLUMN IF NOT EXISTS next_follow_up date;
ALTER TABLE public.reports ADD CONSTRAINT reports_contact_method_check
  CHECK (contact_method IS NULL OR contact_method IN ('sms','whatsapp','call','message','none'));
ALTER TABLE public.reports ADD CONSTRAINT reports_last_contact_outcome_len CHECK (last_contact_outcome IS NULL OR length(last_contact_outcome) <= 120);