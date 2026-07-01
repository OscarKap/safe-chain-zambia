
-- ============ profiles ============
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  province text,
  district text,
  pending_role public.app_role,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR private.is_super_admin(auth.uid()) OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
BEGIN
  BEGIN v_role := (NEW.raw_user_meta_data->>'role')::public.app_role; EXCEPTION WHEN OTHERS THEN v_role := NULL; END;
  INSERT INTO public.profiles (user_id, email, first_name, last_name, phone, pending_role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    v_role,
    CASE WHEN lower(NEW.email) = 'oscar@iscproject.org' THEN 'active' ELSE 'pending' END
  ) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ reports ============
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  description text NOT NULL,
  province text,
  district text,
  reporter_name text,
  reporter_phone text,
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New','Assigned','In_Progress','Escalated','Resolved','Closed')),
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT INSERT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone (incl anonymous victim) can create a report
CREATE POLICY "anon can insert report" ON public.reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth can insert report" ON public.reports FOR INSERT TO authenticated WITH CHECK (true);
-- Staff can view/update reports (any staff role); submitter can view own
CREATE POLICY "staff select reports" ON public.reports FOR SELECT TO authenticated USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(),'admin')
  OR private.has_role(auth.uid(),'responder')
  OR private.has_role(auth.uid(),'gbv_officer')
  OR private.has_role(auth.uid(),'gbv_responder')
  OR private.has_role(auth.uid(),'counsellor')
  OR private.has_role(auth.uid(),'developer')
  OR submitted_by = auth.uid()
);
CREATE POLICY "staff update reports" ON public.reports FOR UPDATE TO authenticated USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(),'admin')
  OR private.has_role(auth.uid(),'responder')
  OR private.has_role(auth.uid(),'gbv_officer')
  OR private.has_role(auth.uid(),'gbv_responder')
) WITH CHECK (true);

CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX reports_status_idx ON public.reports(status);
CREATE INDEX reports_assigned_idx ON public.reports(assigned_to);

-- ============ report_notes ============
CREATE TABLE public.report_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_notes TO authenticated;
GRANT ALL ON public.report_notes TO service_role;
ALTER TABLE public.report_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notes" ON public.report_notes FOR SELECT TO authenticated USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(),'admin')
  OR private.has_role(auth.uid(),'responder')
  OR private.has_role(auth.uid(),'gbv_officer')
  OR private.has_role(auth.uid(),'gbv_responder')
  OR private.has_role(auth.uid(),'counsellor')
);
CREATE POLICY "staff write notes" ON public.report_notes FOR INSERT TO authenticated WITH CHECK (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(),'admin')
  OR private.has_role(auth.uid(),'responder')
  OR private.has_role(auth.uid(),'gbv_officer')
  OR private.has_role(auth.uid(),'gbv_responder')
  OR private.has_role(auth.uid(),'counsellor')
);

-- ============ report_history ============
CREATE TABLE public.report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_history TO authenticated;
GRANT ALL ON public.report_history TO service_role;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read history" ON public.report_history FOR SELECT TO authenticated USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(),'admin')
  OR private.has_role(auth.uid(),'responder')
  OR private.has_role(auth.uid(),'gbv_officer')
  OR private.has_role(auth.uid(),'gbv_responder')
  OR private.has_role(auth.uid(),'counsellor')
);
CREATE POLICY "staff write history" ON public.report_history FOR INSERT TO authenticated WITH CHECK (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(),'admin')
  OR private.has_role(auth.uid(),'responder')
  OR private.has_role(auth.uid(),'gbv_officer')
  OR private.has_role(auth.uid(),'gbv_responder')
);

-- ============ notifications ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX notifications_user_idx ON public.notifications(user_id, read);
