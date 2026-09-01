DROP FUNCTION IF EXISTS public.responder_workload();

CREATE FUNCTION public.responder_workload()
 RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, province text, district text, specialization text, department text, case_types text[], is_available boolean, max_active_cases integer, open_cases bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.user_id, p.first_name, p.last_name, p.email, p.province, p.district,
         p.specialization, p.department, p.case_types, p.is_available, p.max_active_cases,
         COALESCE(oc.n, 0) AS open_cases
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  LEFT JOIN (
    SELECT assigned_to, count(*) AS n
    FROM public.reports
    WHERE assigned_to IS NOT NULL
      AND status NOT IN ('Resolved','Closed')
    GROUP BY assigned_to
  ) oc ON oc.assigned_to = p.user_id
  WHERE ur.role = 'responder'
    AND p.status = 'active'
  ORDER BY open_cases ASC, p.last_name NULLS LAST;
$function$;

REVOKE EXECUTE ON FUNCTION public.responder_workload() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.responder_workload() TO service_role;

CREATE OR REPLACE FUNCTION public.auto_assign_report(_report_id uuid, _caller uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE _rep record; _pick uuid;
BEGIN
  IF _caller IS NULL OR NOT (private.is_super_admin(_caller) OR private.has_role(_caller,'admin')) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  SELECT id, province, district, category INTO _rep FROM public.reports WHERE id = _report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
  SELECT rw.user_id INTO _pick
  FROM public.responder_workload() rw
  WHERE rw.is_available = true AND rw.open_cases < rw.max_active_cases
  ORDER BY
    (_rep.category = ANY(COALESCE(rw.case_types, ARRAY[]::text[]))) DESC,
    (rw.district IS NOT DISTINCT FROM _rep.district) DESC,
    (rw.province IS NOT DISTINCT FROM _rep.province) DESC,
    (rw.specialization IS NOT DISTINCT FROM _rep.category) DESC,
    rw.open_cases ASC
  LIMIT 1;
  IF _pick IS NULL THEN RAISE EXCEPTION 'No available responder' USING ERRCODE='P0001'; END IF;
  UPDATE public.reports SET assigned_to=_pick, status='Assigned', updated_at=now() WHERE id=_report_id;
  INSERT INTO public.report_history (report_id, action, details, actor_id)
  VALUES (_report_id, 'auto_assigned', _pick::text, _caller);
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_pick, 'New case auto-assigned to you (' || substr(_report_id::text,1,8) || ')', 'assignment');
  RETURN _pick;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.auto_assign_report(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_report(uuid, uuid) TO service_role;