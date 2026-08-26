
CREATE POLICY "super admins read rate limit events" ON public.rate_limit_events
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));
GRANT SELECT ON public.rate_limit_events TO authenticated;

CREATE POLICY "own reauth grants read" ON public.admin_reauth_grants
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_super_admin(auth.uid()));
GRANT SELECT ON public.admin_reauth_grants TO authenticated;
