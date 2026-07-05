
-- ============ action_reports ============
CREATE TABLE public.action_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL,
  summary text NOT NULL,
  outcome text NOT NULL,
  recommendations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.action_reports TO authenticated;
GRANT ALL ON public.action_reports TO service_role;
ALTER TABLE public.action_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_reports_read_authorized" ON public.action_reports
FOR SELECT TO authenticated USING (
  responder_id = auth.uid()
  OR private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(), 'admin')
  OR private.has_role(auth.uid(), 'gbv_officer')
);
CREATE POLICY "action_reports_insert_own" ON public.action_reports
FOR INSERT TO authenticated WITH CHECK (responder_id = auth.uid());
CREATE POLICY "action_reports_update_own" ON public.action_reports
FOR UPDATE TO authenticated USING (responder_id = auth.uid()) WITH CHECK (responder_id = auth.uid());

CREATE TRIGGER trg_action_reports_updated
BEFORE UPDATE ON public.action_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ case_attachments ============
CREATE TABLE public.case_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  action_report_id uuid REFERENCES public.action_reports(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  filename text NOT NULL,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.case_attachments TO authenticated;
GRANT ALL ON public.case_attachments TO service_role;
ALTER TABLE public.case_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_attachments_read_authorized" ON public.case_attachments
FOR SELECT TO authenticated USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(), 'admin')
  OR private.has_role(auth.uid(), 'gbv_officer')
  OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = case_attachments.report_id AND r.assigned_to = auth.uid())
);
CREATE POLICY "case_attachments_insert_authorized" ON public.case_attachments
FOR INSERT TO authenticated WITH CHECK (
  uploaded_by = auth.uid() AND (
    private.is_super_admin(auth.uid())
    OR private.has_role(auth.uid(), 'admin')
    OR private.has_role(auth.uid(), 'gbv_officer')
    OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = case_attachments.report_id AND r.assigned_to = auth.uid())
  )
);
CREATE POLICY "case_attachments_delete_authorized" ON public.case_attachments
FOR DELETE TO authenticated USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(), 'admin')
  OR uploaded_by = auth.uid()
);

-- ============ Storage RLS on the private case-attachments bucket ============
CREATE POLICY "case_attachments_bucket_select" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'case-attachments' AND (
    private.is_super_admin(auth.uid())
    OR private.has_role(auth.uid(), 'admin')
    OR private.has_role(auth.uid(), 'gbv_officer')
    OR EXISTS (
      SELECT 1 FROM public.case_attachments ca
      JOIN public.reports r ON r.id = ca.report_id
      WHERE ca.storage_path = storage.objects.name
        AND (r.assigned_to = auth.uid() OR ca.uploaded_by = auth.uid())
    )
  )
);
CREATE POLICY "case_attachments_bucket_insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'case-attachments' AND owner = auth.uid()
);
CREATE POLICY "case_attachments_bucket_delete" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'case-attachments' AND (
    owner = auth.uid()
    OR private.is_super_admin(auth.uid())
    OR private.has_role(auth.uid(), 'admin')
  )
);

-- ============ Manual assignment RPC (server-invoked with service role) ============
CREATE OR REPLACE FUNCTION public.assign_report_to(_report_id uuid, _responder_id uuid, _caller uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private'
AS $function$
DECLARE _rep record; _prev uuid;
BEGIN
  IF _caller IS NULL OR NOT (
    private.is_super_admin(_caller)
    OR private.has_role(_caller,'admin')
    OR private.has_role(_caller,'gbv_officer')
  ) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT id, assigned_to INTO _rep FROM public.reports WHERE id = _report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
  _prev := _rep.assigned_to;

  -- Ensure the responder is active and has the role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _responder_id AND p.status = 'active' AND ur.role = 'responder'
  ) THEN
    RAISE EXCEPTION 'Responder not eligible' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.reports
     SET assigned_to = _responder_id,
         status = CASE WHEN status IN ('New','Awaiting_Review') THEN 'Assigned' ELSE status END,
         updated_at = now()
   WHERE id = _report_id;

  INSERT INTO public.report_history (report_id, action, details, actor_id)
  VALUES (
    _report_id,
    CASE WHEN _prev IS NULL THEN 'assigned' ELSE 'reassigned' END,
    CASE WHEN _prev IS NULL THEN _responder_id::text ELSE (_prev::text || ' → ' || _responder_id::text) END,
    _caller
  );

  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_responder_id, 'New case assigned to you (' || substr(_report_id::text,1,8) || ')', 'assignment');

  IF _prev IS NOT NULL AND _prev <> _responder_id THEN
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (_prev, 'Case ' || substr(_report_id::text,1,8) || ' has been reassigned.', 'reassignment');
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.assign_report_to(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
