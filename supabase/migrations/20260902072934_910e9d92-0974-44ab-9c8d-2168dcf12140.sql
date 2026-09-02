CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key text NOT NULL,
  source_text text NOT NULL,
  source_language text NOT NULL DEFAULT 'en',
  target_language text NOT NULL,
  translated_text text NOT NULL,
  machine_text text,
  context text,
  provider text,
  model text,
  status text NOT NULL DEFAULT 'machine_translated',
  human_reviewed boolean NOT NULL DEFAULT false,
  reviewer uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (translation_key, target_language)
);

CREATE INDEX idx_translations_lang_status ON public.translations (target_language, status);
CREATE INDEX idx_translations_key ON public.translations (translation_key);
CREATE INDEX idx_translations_source_text ON public.translations (target_language, md5(source_text));

CREATE OR REPLACE FUNCTION public.translations_validate()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','machine_translated','human_reviewed','approved','needs_revision') THEN
    RAISE EXCEPTION 'invalid translation status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER translations_validate_trg BEFORE INSERT OR UPDATE ON public.translations
FOR EACH ROW EXECUTE FUNCTION public.translations_validate();

CREATE TRIGGER translations_touch BEFORE UPDATE ON public.translations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.translations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published translations are readable"
ON public.translations FOR SELECT TO anon, authenticated
USING (status IN ('machine_translated','human_reviewed','approved'));

CREATE POLICY "Admins read all translations"
ON public.translations FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins insert translations"
ON public.translations FOR INSERT TO authenticated
WITH CHECK (private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins update translations"
ON public.translations FOR UPDATE TO authenticated
USING (private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'))
WITH CHECK (private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'));

CREATE TABLE public.translation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key text,
  source_text text,
  target_language text NOT NULL,
  provider text,
  error text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_translation_failures_created ON public.translation_failures (created_at DESC);

GRANT SELECT ON public.translation_failures TO authenticated;
GRANT ALL ON public.translation_failures TO service_role;

ALTER TABLE public.translation_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read translation failures"
ON public.translation_failures FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'));