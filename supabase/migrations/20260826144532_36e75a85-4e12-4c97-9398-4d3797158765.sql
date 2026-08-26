
-- ============ 1. MFA recovery codes + enrollment state ============
CREATE TABLE public.mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_recovery_codes_user ON public.mfa_recovery_codes(user_id);
GRANT SELECT ON public.mfa_recovery_codes TO authenticated;
GRANT ALL ON public.mfa_recovery_codes TO service_role;
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recovery codes read" ON public.mfa_recovery_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mfa_enrolled_at timestamp with time zone;

-- ============ 2. Rate limiting / bot protection ============
CREATE TABLE public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  key_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_limit_events_lookup ON public.rate_limit_events(bucket, key_hash, created_at DESC);
GRANT ALL ON public.rate_limit_events TO service_role;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- ============ 3. Step-up re-authentication grants ============
CREATE TABLE public.admin_reauth_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'sensitive',
  expires_at timestamp with time zone NOT NULL,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_reauth_grants_user ON public.admin_reauth_grants(user_id, expires_at DESC);
GRANT ALL ON public.admin_reauth_grants TO service_role;
ALTER TABLE public.admin_reauth_grants ENABLE ROW LEVEL SECURITY;

-- ============ 4. Data retention ============
CREATE TABLE public.retention_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  audit_log_days integer NOT NULL DEFAULT 365 CHECK (audit_log_days BETWEEN 30 AND 3650),
  attachment_days integer NOT NULL DEFAULT 730 CHECK (attachment_days BETWEEN 30 AND 3650),
  notification_days integer NOT NULL DEFAULT 180 CHECK (notification_days BETWEEN 7 AND 3650),
  rate_limit_days integer NOT NULL DEFAULT 7 CHECK (rate_limit_days BETWEEN 1 AND 365),
  auto_purge_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
INSERT INTO public.retention_settings (id) VALUES (true);
GRANT SELECT ON public.retention_settings TO authenticated;
GRANT ALL ON public.retention_settings TO service_role;
ALTER TABLE public.retention_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins read retention" ON public.retention_settings
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

CREATE TABLE public.retention_purge_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamp with time zone NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES auth.users(id),
  trigger_source text NOT NULL DEFAULT 'manual',
  dry_run boolean NOT NULL DEFAULT false,
  deleted_audit_logs integer NOT NULL DEFAULT 0,
  deleted_attachments integer NOT NULL DEFAULT 0,
  deleted_notifications integer NOT NULL DEFAULT 0,
  deleted_rate_limits integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.retention_purge_runs TO authenticated;
GRANT ALL ON public.retention_purge_runs TO service_role;
ALTER TABLE public.retention_purge_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins read purge runs" ON public.retention_purge_runs
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

-- Audit logs remain immutable, but the retention purge may delete expired rows.
CREATE OR REPLACE FUNCTION public.admin_activity_logs_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND coalesce(current_setting('safechain.retention_purge', true), '') = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'admin_activity_logs is append-only';
END;
$$;

CREATE OR REPLACE FUNCTION public.run_retention_purge(_dry_run boolean DEFAULT false, _source text DEFAULT 'manual', _actor uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  s public.retention_settings%ROWTYPE;
  n_logs integer := 0;
  n_att integer := 0;
  n_notif integer := 0;
  n_rl integer := 0;
  paths text[] := ARRAY[]::text[];
BEGIN
  SELECT * INTO s FROM public.retention_settings WHERE id;

  SELECT coalesce(array_agg(storage_path), ARRAY[]::text[]) INTO paths
  FROM public.case_attachments
  WHERE created_at < now() - make_interval(days => s.attachment_days);

  IF _dry_run THEN
    SELECT count(*) INTO n_logs FROM public.admin_activity_logs
      WHERE created_at < now() - make_interval(days => s.audit_log_days);
    n_att := coalesce(array_length(paths, 1), 0);
    SELECT count(*) INTO n_notif FROM public.notifications
      WHERE created_at < now() - make_interval(days => s.notification_days);
    SELECT count(*) INTO n_rl FROM public.rate_limit_events
      WHERE created_at < now() - make_interval(days => s.rate_limit_days);
  ELSE
    PERFORM set_config('safechain.retention_purge', 'on', true);
    WITH d AS (
      DELETE FROM public.admin_activity_logs
      WHERE created_at < now() - make_interval(days => s.audit_log_days) RETURNING 1
    ) SELECT count(*) INTO n_logs FROM d;
    PERFORM set_config('safechain.retention_purge', 'off', true);

    WITH d AS (
      DELETE FROM public.case_attachments
      WHERE created_at < now() - make_interval(days => s.attachment_days) RETURNING 1
    ) SELECT count(*) INTO n_att FROM d;

    WITH d AS (
      DELETE FROM public.notifications
      WHERE created_at < now() - make_interval(days => s.notification_days) RETURNING 1
    ) SELECT count(*) INTO n_notif FROM d;

    WITH d AS (
      DELETE FROM public.rate_limit_events
      WHERE created_at < now() - make_interval(days => s.rate_limit_days) RETURNING 1
    ) SELECT count(*) INTO n_rl FROM d;
  END IF;

  INSERT INTO public.retention_purge_runs
    (actor_user_id, trigger_source, dry_run, deleted_audit_logs, deleted_attachments, deleted_notifications, deleted_rate_limits)
  VALUES (_actor, _source, _dry_run, n_logs, n_att, n_notif, n_rl);

  RETURN jsonb_build_object(
    'dry_run', _dry_run,
    'audit_logs', n_logs,
    'attachments', n_att,
    'notifications', n_notif,
    'rate_limits', n_rl,
    'storage_paths', to_jsonb(paths)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_retention_purge(boolean, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_retention_purge(boolean, text, uuid) TO service_role;
