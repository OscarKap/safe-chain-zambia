ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS report_id uuid, ADD COLUMN IF NOT EXISTS whatsapp_to text, ADD COLUMN IF NOT EXISTS whatsapp_text text;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

CREATE OR REPLACE FUNCTION public.notify_case_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref text := 'SC-' || to_char(NEW.created_at,'YYYY') || '-' || upper(left(NEW.id::text,8));
  label text := NEW.category || coalesce(' · ' || NEW.subcategory,'');
  where_ text := coalesce(NEW.district || ', ','') || coalesce(NEW.province,'');
  actor_phone text; actor_name text; resp_phone text; resp_name text; msg text;
BEGIN
  SELECT phone, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')) INTO actor_phone, actor_name FROM profiles WHERE user_id = auth.uid();
  IF NEW.assigned_to IS NOT NULL THEN
    SELECT phone, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')) INTO resp_phone, resp_name FROM profiles WHERE user_id = NEW.assigned_to;
  END IF;

  IF TG_OP = 'INSERT' THEN
    msg := 'New case reported: ' || ref || ' (' || label || ') in ' || where_ || ' — priority ' || NEW.priority || '.';
    INSERT INTO notifications(user_id, message, type, report_id)
      SELECT DISTINCT ur.user_id, msg, 'case_new', NEW.id FROM user_roles ur
      WHERE ur.role IN ('super_admin','admin','gbv_officer') AND ur.user_id IS DISTINCT FROM auth.uid();
    RETURN NEW;
  END IF;

  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    msg := 'Case ' || ref || ' (' || label || ', ' || where_ || ') has been assigned to you. Please open SafeChain and accept it.';
    INSERT INTO notifications(user_id, message, type, report_id, whatsapp_to, whatsapp_text)
      VALUES (NEW.assigned_to, msg, 'case_assigned', NEW.id, actor_phone,
        'Hello, this is ' || coalesce(nullif(resp_name,''),'the assigned responder') || ' about SafeChain case ' || ref || '.');
    -- one-tap WhatsApp for the assigning admin to alert the responder
    IF auth.uid() IS NOT NULL AND resp_phone IS NOT NULL THEN
      INSERT INTO notifications(user_id, message, type, report_id, whatsapp_to, whatsapp_text, read)
        VALUES (auth.uid(), 'You assigned ' || ref || ' to ' || coalesce(nullif(resp_name,''),'a responder') || '. Tap WhatsApp to alert them.', 'case_assigned_admin', NEW.id, resp_phone,
          'SafeChain alert: case ' || ref || ' (' || label || ', ' || where_ || ') has been assigned to you. Please log in and accept it.', false);
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Accepted','Resolved','Escalated','Closed') THEN
    msg := 'Case ' || ref || ' is now ' || NEW.status || coalesce(' by ' || nullif(resp_name,''),'') || '.';
    INSERT INTO notifications(user_id, message, type, report_id, whatsapp_to, whatsapp_text)
      SELECT DISTINCT ur.user_id, msg, 'case_' || lower(NEW.status), NEW.id, resp_phone,
        'Hello, this is SafeChain admin about case ' || ref || ' (' || NEW.status || ').'
      FROM user_roles ur WHERE ur.role IN ('super_admin','admin','gbv_officer') AND ur.user_id IS DISTINCT FROM auth.uid();
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_case_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reports_notify ON public.reports;
CREATE TRIGGER reports_notify AFTER INSERT OR UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.notify_case_event();