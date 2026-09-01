ALTER TABLE public.action_reports
  ADD COLUMN IF NOT EXISTS planned_actions text,
  ADD COLUMN IF NOT EXISTS help_provided text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS case_opened boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS case_number text,
  ADD COLUMN IF NOT EXISTS referral_agency text,
  ADD COLUMN IF NOT EXISTS victim_condition text,
  ADD COLUMN IF NOT EXISTS follow_up_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_date date;