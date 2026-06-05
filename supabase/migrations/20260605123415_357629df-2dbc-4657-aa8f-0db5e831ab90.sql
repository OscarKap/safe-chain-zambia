
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'gbv_responder',
  'clinic_admin',
  'community_volunteer',
  'counsellor',
  'data_reviewer'
);

CREATE TYPE public.request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

-- =========================================================
-- TABLES
-- =========================================================
CREATE TABLE public.admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_role public.app_role NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_requests_status ON public.admin_access_requests(status, created_at DESC);
CREATE INDEX idx_admin_requests_email ON public.admin_access_requests(email);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

CREATE TABLE public.admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  organisation TEXT,
  province TEXT,
  district TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  accepted_privacy_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_created ON public.admin_activity_logs(created_at DESC);
CREATE INDEX idx_activity_actor ON public.admin_activity_logs(actor_user_id);

-- =========================================================
-- GRANTS
-- =========================================================
GRANT INSERT ON public.admin_access_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.admin_access_requests TO authenticated;
GRANT ALL ON public.admin_access_requests TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, UPDATE ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;

GRANT SELECT ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;

-- =========================================================
-- SECURITY DEFINER HELPERS (avoid RLS recursion)
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs   ENABLE ROW LEVEL SECURITY;

-- admin_access_requests
CREATE POLICY "Anyone can submit an admin access request"
  ON public.admin_access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can view all requests"
  ON public.admin_access_requests
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update requests"
  ON public.admin_access_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- user_roles
CREATE POLICY "Users see their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- admin_profiles
CREATE POLICY "Admins read their own profile or super sees all"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins update their own profile"
  ON public.admin_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- admin_activity_logs
CREATE POLICY "Super admins can view audit logs"
  ON public.admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- =========================================================
-- TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_requests_updated
  BEFORE UPDATE ON public.admin_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bootstrap Oscar as super_admin on first signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'oscar@iscproject.org' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.admin_profiles (user_id, full_name, must_change_password)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Oscar (Owner)'), false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
