ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS case_types text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS profiles_department_idx ON public.profiles (department);
CREATE INDEX IF NOT EXISTS profiles_case_types_idx ON public.profiles USING gin (case_types);