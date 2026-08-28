import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { startSessionPolicy, clearSessionMarks } from "@/lib/session-policy";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthGate,
});

type MfaState = "checking" | "ok" | "enroll" | "verify";

function AuthGate() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mfa, setMfa] = useState<MfaState>("checking");

  // Redirect unauthenticated visitors to the staff entry point.
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/basecontrol", replace: true });
    }
  }, [loading, user, navigate]);

  // Session policy: idle timeout, absolute lifetime, token rotation.
  useEffect(() => {
    if (!user) return;
    const stop = startSessionPolicy(async (reason) => {
      clearSessionMarks();
      await logout();
      toast.info(
        reason === "idle"
          ? "You were signed out after 20 minutes of inactivity."
          : "Your session reached its 8 hour limit. Please sign in again.",
      );
      navigate({ to: "/basecontrol", replace: true });
    });
    return stop;
  }, [user, logout, navigate]);

  // MFA enforcement: every staff account must enrol, and verify at each sign-in.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) return;
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = (factors?.totp ?? []).filter((f) => f.status === "verified");
        if (cancelled) return;
        if (verified.length === 0) {
          setMfa("enroll");
        } else if (aal?.currentLevel === "aal1" && aal.nextLevel === "aal2") {
          setMfa("verify");
        } else {
          setMfa("ok");
        }
      } catch {
        if (!cancelled) setMfa("ok");
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [user, location.pathname]);

  useEffect(() => {
    if (mfa === "enroll" && location.pathname !== "/account/security") {
      navigate({ to: "/account/security", replace: true });
    }
    if (mfa === "verify") {
      navigate({ to: "/mfa-verify", search: { redirect: location.pathname }, replace: true });
    }
  }, [mfa, location.pathname, navigate]);

  if (loading || (user && mfa === "checking")) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return null;
  if (mfa === "verify") return null;
  return <Outlet />;
}
