
-- Secure RPCs for user management. All SECURITY DEFINER, all verify caller is super_admin.

CREATE OR REPLACE FUNCTION public.admin_approve_user(_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  _caller uuid := auth.uid();
  _role public.app_role;
  _email text;
BEGIN
  IF _caller IS NULL OR NOT private.is_super_admin(_caller) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT pending_role, email INTO _role, _email
  FROM public.profiles WHERE user_id = _target;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  _role := COALESCE(_role, 'responder'::public.app_role);

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target, _role, _caller)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles SET status = 'active', updated_at = now() WHERE user_id = _target;

  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_target, 'Your Safe Chain account has been approved. You can now sign in.', 'account_approved');

  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id, metadata)
  VALUES (_caller, 'approve_user', 'user', _target::text, jsonb_build_object('role', _role, 'email', _email));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_user(_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL OR NOT private.is_super_admin(_caller) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET status = 'rejected', updated_at = now() WHERE user_id = _target;
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_target, 'Your Safe Chain access request was not approved.', 'account_rejected');
  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id)
  VALUES (_caller, 'reject_user', 'user', _target::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_suspend_user(_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL OR NOT private.is_super_admin(_caller) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET status = 'suspended', updated_at = now() WHERE user_id = _target;
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_target, 'Your Safe Chain account has been suspended.', 'account_suspended');
  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id)
  VALUES (_caller, 'suspend_user', 'user', _target::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_user(_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL OR NOT private.is_super_admin(_caller) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET status = 'active', updated_at = now() WHERE user_id = _target;
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_target, 'Your Safe Chain account has been reactivated.', 'account_reactivated');
  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id)
  VALUES (_caller, 'reactivate_user', 'user', _target::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_target uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL OR NOT private.is_super_admin(_caller) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role, granted_by) VALUES (_target, _role, _caller);
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_target, 'Your Safe Chain role has been updated to ' || _role::text || '.', 'role_changed');
  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id, metadata)
  VALUES (_caller, 'change_role', 'user', _target::text, jsonb_build_object('role', _role));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL OR NOT private.is_super_admin(_caller) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  IF _target = _caller THEN RAISE EXCEPTION 'Cannot delete yourself'; END IF;
  INSERT INTO public.admin_activity_logs (actor_user_id, action, target_type, target_id)
  VALUES (_caller, 'delete_user', 'user', _target::text);
  DELETE FROM auth.users WHERE id = _target;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reject_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_suspend_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reactivate_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
