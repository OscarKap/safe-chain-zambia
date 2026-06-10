import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { dashboard, users, reports, notifications, apiErrorMessage } from "@/lib/api";
import { DashboardShell, StatCard, SectionCard } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin dashboard — Safe Chain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (user && user.role !== "super_admin" && user.role !== "admin") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);

  const isSuper = user?.role === "super_admin";

  const statsQ = useQuery<Awaited<ReturnType<typeof dashboard.superAdmin>> | Awaited<ReturnType<typeof dashboard.admin>>>({
    queryKey: ["dashboard", isSuper ? "super-admin" : "admin"],
    queryFn: () => (isSuper ? dashboard.superAdmin() : dashboard.admin()),
    enabled: !!user,
  });

  const pendingQ = useQuery({
    queryKey: ["users", "pending"],
    queryFn: users.pending,
    enabled: isSuper,
  });
  const reportsQ = useQuery({ queryKey: ["reports"], queryFn: reports.list, enabled: !!user });
  const notifQ = useQuery({ queryKey: ["notifications"], queryFn: notifications.list, enabled: !!user });

  const approve = useMutation({
    mutationFn: (id: string) => users.approve(id),
    onSuccess: () => { toast.success("User approved"); qc.invalidateQueries({ queryKey: ["users", "pending"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const reject = useMutation({
    mutationFn: (id: string) => users.reject(id),
    onSuccess: () => { toast.success("User rejected"); qc.invalidateQueries({ queryKey: ["users", "pending"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (!user) return null;

  return (
    <DashboardShell title={isSuper ? "Super Admin Dashboard" : "Admin Dashboard"}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsQ.isLoading && <p className="text-sm text-muted-foreground">Loading stats…</p>}
        {statsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(statsQ.error)}</p>}
        {statsQ.data && isSuper && <SuperStats s={statsQ.data as Awaited<ReturnType<typeof dashboard.superAdmin>>} />}
        {statsQ.data && !isSuper && <AdminStatsView s={statsQ.data as Awaited<ReturnType<typeof dashboard.admin>>} />}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {isSuper && (
          <SectionCard title="Pending user approvals">
            {pendingQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {pendingQ.error && <p className="text-sm text-destructive">{apiErrorMessage(pendingQ.error)}</p>}
            {pendingQ.data && pendingQ.data.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
            <ul className="space-y-3">
              {pendingQ.data?.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="text-sm">
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-muted-foreground text-xs">{u.email} · {u.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(u.id)}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >Approve</button>
                    <button
                      disabled={reject.isPending}
                      onClick={() => reject.mutate(u.id)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
                    >Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        <SectionCard title="Recent reports">
          {reportsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {reportsQ.error && <p className="text-sm text-destructive">{apiErrorMessage(reportsQ.error)}</p>}
          {reportsQ.data && reportsQ.data.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
          <ul className="divide-y divide-border">
            {reportsQ.data?.slice(0, 10).map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{r.category}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Notifications">
          {notifQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {notifQ.error && <p className="text-sm text-destructive">{apiErrorMessage(notifQ.error)}</p>}
          {notifQ.data && notifQ.data.length === 0 && <p className="text-sm text-muted-foreground">No notifications.</p>}
          <ul className="space-y-2">
            {notifQ.data?.slice(0, 10).map((n) => (
              <li key={n.id} className={`text-sm rounded-lg border border-border p-3 ${n.read ? "opacity-60" : ""}`}>
                {n.message}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
