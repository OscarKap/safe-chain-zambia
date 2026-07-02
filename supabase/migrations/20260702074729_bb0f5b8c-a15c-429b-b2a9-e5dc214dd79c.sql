
DROP POLICY IF EXISTS "auth can insert report" ON public.reports;
DROP POLICY IF EXISTS "anon can insert report" ON public.reports;
DROP POLICY IF EXISTS "staff update reports" ON public.reports;

CREATE POLICY "auth can insert report" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by IS NULL OR submitted_by = auth.uid());

CREATE POLICY "anon can insert report" ON public.reports
  FOR INSERT TO anon
  WITH CHECK (submitted_by IS NULL);

CREATE POLICY "staff update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (
    private.is_super_admin(auth.uid())
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'responder'::app_role)
    OR private.has_role(auth.uid(), 'gbv_officer'::app_role)
    OR private.has_role(auth.uid(), 'gbv_responder'::app_role)
  )
  WITH CHECK (
    private.is_super_admin(auth.uid())
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'responder'::app_role)
    OR private.has_role(auth.uid(), 'gbv_officer'::app_role)
    OR private.has_role(auth.uid(), 'gbv_responder'::app_role)
  );
