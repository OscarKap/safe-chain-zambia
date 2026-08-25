-- 1. Case-view auditing
CREATE OR REPLACE FUNCTION public.log_case_view(_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF NOT private.can_access_report(auth.uid(), _report_id)
     AND NOT private.has_role(auth.uid(), 'counsellor'::public.app_role)
     AND NOT private.has_role(auth.uid(), 'gbv_responder'::public.app_role)
     AND NOT private.has_role(auth.uid(), 'responder'::public.app_role) THEN
    RETURN;
  END IF;

  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id)
  VALUES (auth.uid(), 'view_case', 'report', _report_id::text);
END;
$$;

REVOKE ALL ON FUNCTION public.log_case_view(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_case_view(uuid) TO authenticated;

-- 2. Make the audit log immutable
CREATE OR REPLACE FUNCTION public.admin_activity_logs_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'admin_activity_logs is append-only';
END;
$$;

DROP TRIGGER IF EXISTS admin_activity_logs_no_change ON public.admin_activity_logs;
CREATE TRIGGER admin_activity_logs_no_change
BEFORE UPDATE OR DELETE ON public.admin_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.admin_activity_logs_immutable();

-- 3. Attachment type / size guard
CREATE OR REPLACE FUNCTION public.case_attachments_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.size_bytes IS NOT NULL AND NEW.size_bytes > 26214400 THEN
    RAISE EXCEPTION 'Attachment exceeds the 25 MB limit';
  END IF;
  IF NEW.content_type IS NOT NULL AND NEW.content_type NOT IN (
    'image/jpeg','image/png','image/webp','image/gif','image/heic',
    'application/pdf','text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm',
    'video/mp4','video/webm','video/quicktime'
  ) THEN
    RAISE EXCEPTION 'Unsupported attachment type: %', NEW.content_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS case_attachments_validate_trg ON public.case_attachments;
CREATE TRIGGER case_attachments_validate_trg
BEFORE INSERT ON public.case_attachments
FOR EACH ROW EXECUTE FUNCTION public.case_attachments_validate();