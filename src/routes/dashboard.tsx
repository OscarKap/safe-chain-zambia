import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_DASHBOARD } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/basecontrol", replace: true });
    else navigate({ to: ROLE_DASHBOARD[user.role] ?? "/admin/dashboard", replace: true });
  }, [user, loading, navigate]);
  return (
    <div className="min-h-[60vh] grid place-items-center text-sm text-muted-foreground">
      Loading your dashboard…
    </div>
  );
}
