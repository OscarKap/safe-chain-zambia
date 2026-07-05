
-- Lock down SECURITY DEFINER trigger functions: no direct execute needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

-- Revoke public/anon execute on all SECURITY DEFINER RPCs; keep authenticated
-- (functions perform their own internal authorization checks via private.is_super_admin/has_role)
REVOKE ALL ON FUNCTION public.admin_approve_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reject_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_suspend_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reactivate_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.auto_assign_report(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.responder_workload() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.responder_workload() TO authenticated;
