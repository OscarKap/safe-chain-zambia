
-- Create a private schema not exposed by PostgREST
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- Recreate helper functions inside the private schema
CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Allow RLS evaluation to call them (RLS runs with the calling role's privileges)
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate policies to point at the private-schema helpers
DROP POLICY IF EXISTS "Admins read their own profile or super sees all" ON public.admin_profiles;
CREATE POLICY "Admins read their own profile or super sees all"
ON public.admin_profiles
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update their own profile" ON public.admin_profiles;
CREATE POLICY "Admins update their own profile"
ON public.admin_profiles
FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()))
WITH CHECK ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.admin_activity_logs;
CREATE POLICY "Super admins can view audit logs"
ON public.admin_activity_logs
FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update requests" ON public.admin_access_requests;
CREATE POLICY "Super admins can update requests"
ON public.admin_access_requests
FOR UPDATE TO authenticated
USING (private.is_super_admin(auth.uid()))
WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all requests" ON public.admin_access_requests;
CREATE POLICY "Super admins can view all requests"
ON public.admin_access_requests
FOR SELECT TO authenticated
USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users see their own roles" ON public.user_roles;
CREATE POLICY "Users see their own roles"
ON public.user_roles
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.is_super_admin(auth.uid()));

-- Drop the public-schema helpers now that nothing references them
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
