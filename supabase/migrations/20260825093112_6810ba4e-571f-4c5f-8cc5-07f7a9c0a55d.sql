-- Helper: can this user act on this report?
CREATE OR REPLACE FUNCTION private.can_access_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT _user_id IS NOT NULL AND (
    private.is_super_admin(_user_id)
    OR private.has_role(_user_id, 'admin'::public.app_role)
    OR private.has_role(_user_id, 'gbv_officer'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = _report_id AND r.assigned_to = _user_id
    )
  )
$$;

REVOKE ALL ON FUNCTION private.can_access_report(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Replace loose storage policies on the private case-attachments bucket
DROP POLICY IF EXISTS "case_attachments_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "case_attachments_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "case_attachments_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "case_attachments_bucket_delete" ON storage.objects;

CREATE POLICY "case_attachments_bucket_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'case-attachments'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND private.can_access_report(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "case_attachments_bucket_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'case-attachments'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND private.can_access_report(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "case_attachments_bucket_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'case-attachments'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND private.can_access_report(auth.uid(), ((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'case-attachments'
  AND owner = auth.uid()
);

CREATE POLICY "case_attachments_bucket_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'case-attachments'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (
    private.is_super_admin(auth.uid())
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
    OR owner = auth.uid()
  )
);